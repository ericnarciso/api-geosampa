<div align="center">

# GeoSampa API (Não Oficial)

**Dados cadastrais, fiscais e urbanísticos oficiais da cidade de São Paulo em JSON, direto via HTTP.**<br>
Consultas de IPTU/SQL, lotes, zoneamento (LPUOS), patrimônio tombado, áreas contaminadas e riscos geológicos via WFS do GeoSampa — sem navegador, sem autenticação e sem API key.

[![Node ≥ 22.13](https://img.shields.io/badge/node-%E2%89%A5%2022.13-3c873a?logo=nodedotjs&logoColor=white)](package.json)
[![Protocolo: OGC WFS 1.0.0](https://img.shields.io/badge/OGC%20WFS-1.0.0-2a78d6)](sites/geosampa.md)
[![Projeção: SIRGAS 2000](https://img.shields.io/badge/EPSG-31983%20(SIRGAS%202000)-5b6ee1)](sites/geosampa.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-3987e5)](LICENSE)

[Início&nbsp;rápido](#início-rápido) · [Exemplo&nbsp;prático](#exemplo-prático) · [Operações](#operações-disponíveis) · [Como&nbsp;funciona](#como-funciona) · [MCP&nbsp;para&nbsp;agentes](#uso-com-agentes-de-ia-mcp) · [Notas&nbsp;técnicas](sites/geosampa.md)

</div>

Consultar viabilidade urbanística ou dados de um lote no portal GeoSampa normalmente exige abrir um mapa pesado no navegador, clicar em camadas, copiar números de SQL e cruzar PDFs. Este projeto encapsula os endpoints públicos do **GeoServer WFS oficial da Prefeitura de São Paulo** em uma spec declarativa ([`sites/geosampa.json`](sites/geosampa.json)) sobre o motor do [api-anything](https://github.com/goodnight000/api-anything), entregando respostas estruturadas em JSON com uma única requisição HTTP (`tier: 1`).

## Início rápido

Pré-requisito: **Node.js ≥ 22.13**.

```sh
git clone https://github.com/ericnarciso/api-geosampa.git
cd api-geosampa
npm ci
npm run build
```

Faça uma consulta direta pela CLI usando Setor, Quadra e Lote (SQL):

```sh
npm run cli -- call geosampa getLoteBySql setor=009 quadra=048 lote=0138
```

Ou importe diretamente em Node.js / ESM:

```js
import { call } from "./dist/index.js";

const res = await call("geosampa", "getLoteBySql", {
  setor: "009",
  quadra: "048",
  lote: "0138",
}, { maxTier: 1 });

console.log(res.data);
```

`maxTier: 1` garante execução 100% via HTTP (`fetch` do Node), sem abrir navegador headless.

## Exemplo prático

O script [`examples/consulta_geosampa.mjs`](examples/consulta_geosampa.mjs) executa um estudo preliminar completo de um imóvel a partir do endereço e número:

```sh
node examples/consulta_geosampa.mjs PAULISTA 1000
```

Em sequência, ele:

1. **Localiza o lote** (`searchLoteByEndereco`) e exibe SQL, uso, área do terreno, área construída e situação cadastral.
2. **Calcula o Bounding Box** (`minx`, `miny`, `maxx`, `maxy`) em **SIRGAS 2000 / UTM 23S (EPSG:31983)** a partir dos vértices do polígono.
3. **Consulta o zoneamento** (`getZoneamento`) segundo a Lei 16.402/16 (LPUOS).
4. **Verifica patrimônio histórico** (`getBensTombados`) — incidência de tombamento ou ZEPEC.
5. **Checa áreas contaminadas** (`getAreasContaminadas`) cadastradas pela SVMA/PMSP em um buffer de 100 m ao redor do lote.

## Operações disponíveis

Todas as 9 operações definidas em [`sites/geosampa.json`](sites/geosampa.json) são somente leitura (`readOnly: true`), públicas e respondem em `tier: 1`:

| Operação | Parâmetros | Descrição |
|---|---|---|
| `getLoteBySql` | `setor`, `quadra`, `lote` | Busca um lote fiscal pelo número do SQL (Setor, Quadra e Lote do IPTU). |
| `searchLoteByEndereco` | `logradouro`, `numero` | Busca lotes fiscais pelo nome do logradouro e número de porta em São Paulo. |
| `getQuadraLotes` | `setor`, `quadra` | Lista todos os lotes de uma quadra fiscal (útil para remembramento e entorno). |
| `getZoneamento` | `minx`, `miny`, `maxx`, `maxy` | Consulta o zoneamento (LPUOS - Lei 16.402/16) incidente sobre o bounding box. |
| `getBensTombados` | `setor`, `quadra`, `lote` | Verifica bens tombados ou ZEPEC no SQL do lote (municipal, estadual ou federal). |
| `getEnvoltoriaTombamento` | `minx`, `miny`, `maxx`, `maxy` | Verifica se o bounding box incide em área envoltória de bem tombado do CONPRESP. |
| `getAreasContaminadas` | `minx`, `miny`, `maxx`, `maxy` | Consulta áreas contaminadas, em monitoramento ou reabilitadas (SVMA/PMSP). |
| `getRiscosGeologicos` | `minx`, `miny`, `maxx`, `maxy` | Consulta setores de risco geológico mapeados (escorregamento, erosão, solapamento). |
| `queryLayer` | `typeName`, `cqlFilter`, `maxFeatures?` | Executa consulta WFS genérica em qualquer camada do GeoSampa com filtro CQL. |

## Como funciona

- **Fonte oficial:** todas as chamadas apontam para o GeoServer WFS público da Prefeitura de São Paulo (`wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs`) usando OGC WFS 1.0.0 `GetFeature` com `outputFormat=application/json`.
- **Projeção espacial:** coordenadas e bounding boxes utilizam **SIRGAS 2000 / UTM 23S (EPSG:31983)**.
- **Validação:** a spec do GeoSampa é validada pela suíte de regras compartilhadas do repositório (`test/registry.test.ts` / `vetShared`), garantindo zero credenciais e tipagem consistente.

Consulte [`sites/geosampa.md`](sites/geosampa.md) para o fluxo recomendado de estudos de viabilidade e notas de manutenção.

## Uso com agentes de IA (MCP)

Como o projeto roda sobre o motor do `api-anything`, você pode expor as operações do GeoSampa diretamente via **MCP (Model Context Protocol)** para agentes como Claude Code, Cursor, Codex, VS Code e Gemini CLI:

```sh
npm run cli -- setup
```

Ou iniciar o servidor MCP diretamente:

```sh
npm run cli -- mcp
```

## Aviso e uso responsável

- Este é um projeto **não oficial**, sem vínculo com a Prefeitura do Município de São Paulo (PMSP).
- Os dados retornados são públicos e provenientes diretamente da infraestrutura aberta do GeoSampa.
- Mantenha as consultas espaçadas e evite rajadas excessivas para fazer uso responsável do serviço público.

## Créditos e licença

- Motor de execução, CLI e servidor MCP baseados em [api-anything](https://github.com/goodnight000/api-anything).
- Licenciado sob a [MIT License](LICENSE).
