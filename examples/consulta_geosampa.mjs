import { call } from "../dist/index.js";

async function consultarImovel(endereco, numero) {
  console.log(`\n======================================================`);
  console.log(`🔍 1. Buscando Lote: ${endereco}, nº ${numero}`);
  console.log(`======================================================`);

  const resLote = await call("geosampa", "searchLoteByEndereco", {
    logradouro: endereco,
    numero: String(numero)
  }, { maxTier: 1 });

  if (!resLote.ok || !resLote.data || resLote.data.length === 0) {
    console.log("❌ Lote não encontrado para este endereço.");
    return;
  }

  const lote = resLote.data[0];
  console.log(`✅ Lote Localizado!`);
  console.log(`   - SQL: ${lote.setor}-${lote.quadra}-${lote.lote}-${lote.digito}`);
  console.log(`   - Logradouro: ${lote.logradouro}, ${lote.numero}`);
  console.log(`   - Uso: ${lote.uso || "Não informado"}`);
  console.log(`   - Área do Terreno: ${lote.areaTerreno} m²`);
  console.log(`   - Área Construída: ${lote.areaConstruida} m²`);
  console.log(`   - Situação Cadastral: ${lote.situacao}`);

  // Calcula Bounding Box (minx, miny, maxx, maxy) a partir dos vértices do polígono
  const coords = lote.coordinates[0];
  const xs = coords.map(c => c[0]);
  const ys = coords.map(c => c[1]);
  const minx = Math.floor(Math.min(...xs));
  const maxx = Math.ceil(Math.max(...xs));
  const miny = Math.floor(Math.min(...ys));
  const maxy = Math.ceil(Math.max(...ys));

  console.log(`\n📍 BBOX (SIRGAS 2000): [${minx}, ${miny}, ${maxx}, ${maxy}]`);

  // 2. Zoneamento
  console.log(`\n======================================================`);
  console.log(`🏛️ 2. Consultando Zoneamento (LPUOS - Lei 16.402/16)`);
  console.log(`======================================================`);
  const resZona = await call("geosampa", "getZoneamento", {
    minx: String(minx),
    miny: String(miny),
    maxx: String(maxx),
    maxy: String(maxy)
  }, { maxTier: 1 });

  if (resZona.ok && resZona.data && resZona.data.length > 0) {
    const zonasUnicas = [...new Set(resZona.data.map(z => z.zona))];
    console.log(`✅ Zonas Incidentes: ${zonasUnicas.join(", ")}`);
    resZona.data.forEach(z => {
      console.log(`   - Zona: ${z.zona} (Código: ${z.codigoZona}) | Lei: ${z.lei}/${z.anoLei}`);
    });
  } else {
    console.log("ℹ️ Nenhum perímetro de zoneamento retornado para este recorte.");
  }

  // 3. Patrimônio Histórico / Tombamento
  console.log(`\n======================================================`);
  console.log(`🏛️ 3. Verificando Bens Tombados / ZEPEC`);
  console.log(`======================================================`);
  const resTomb = await call("geosampa", "getBensTombados", {
    setor: lote.setor,
    quadra: lote.quadra,
    lote: lote.lote
  }, { maxTier: 1 });

  if (resTomb.ok && resTomb.data && resTomb.data.length > 0) {
    console.log(`⚠️ ALERTA: Imóvel com incidência de proteção de patrimônio histórico!`);
    resTomb.data.forEach(t => {
      console.log(`   - Bem Tombado: ${t.nome}`);
      console.log(`   - Resolução CONPRESP: ${t.resolucaoConpresp || "Não consta"}`);
      console.log(`   - Resolução CONDEPHAAT: ${t.resolucaoCondephaat || "Não consta"}`);
      console.log(`   - Categoria ZEPEC: ${t.zepec || "Não consta"}`);
    });
  } else {
    console.log(`✅ Nenhum tombamento cadastrado diretamente para este SQL.`);
  }

  // 4. Áreas Contaminadas
  console.log(`\n======================================================`);
  console.log(`🌱 4. Verificando Áreas Contaminadas (SVMA/SIGAC)`);
  console.log(`======================================================`);
  // Buffer de 100 metros ao redor do lote
  const resContam = await call("geosampa", "getAreasContaminadas", {
    minx: String(minx - 100),
    miny: String(miny - 100),
    maxx: String(maxx + 100),
    maxy: String(maxy + 100)
  }, { maxTier: 1 });

  if (resContam.ok && resContam.data && resContam.data.length > 0) {
    console.log(`⚠️ Foram encontradas ${resContam.data.length} áreas contaminadas/reabilitadas no raio de 100m:`);
    resContam.data.slice(0, 3).forEach(c => {
      console.log(`   - Endereço: ${c.endereco}`);
      console.log(`     Classificação: ${c.classificacao} | Contaminante: ${c.contaminante || "Não informado"}`);
    });
  } else {
    console.log(`✅ Nenhuma área contaminada registrada no entorno imediato.`);
  }

  console.log(`\n======================================================`);
  console.log(`✨ Estudo preliminar concluído com sucesso via GeoSampa API!`);
  console.log(`======================================================\n`);
}

// Executa teste para Av. Paulista, 1000
const args = process.argv.slice(2);
const endereco = args[0] || "PAULISTA";
const numero = args[1] || "1000";

consultarImovel(endereco, numero).catch(console.error);
