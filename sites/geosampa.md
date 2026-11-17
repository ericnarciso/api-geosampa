Nenhuma autenticação é necessária. Os dados são públicos e oficiais da Prefeitura do Município de São Paulo (PMSP / GeoSampa).
O serviço WFS do GeoServer responde em HTTP tier 1 de forma direta e rápida. Mantenha as consultas espaçadas para uso responsável da infraestrutura pública.

- Coordenadas e BBOX utilizam o sistema de projeção oficial do município de São Paulo: SIRGAS 2000 / UTM 23S (EPSG:31983).
- O número de inscrição imobiliária (SQL) é composto por Setor (3 dígitos), Quadra (3 dígitos), Lote (4 dígitos) e dígito verificador.
- Para estudos de viabilidade, o fluxo recomendado para agentes de IA é:
  1. Localizar o lote com `getLoteBySql` ou `searchLoteByEndereco` para obter dados de área, testada, uso e as coordenadas do polígono.
  2. Calcular o bounding box (`minx, miny, maxx, maxy`) a partir das coordenadas do lote.
  3. Consultar o zoneamento incidente com `getZoneamento(minx, miny, maxx, maxy)` para obter os perímetros de zona (ZEU, ZM, ZCOR, etc.) segundo a Lei 16.402/16.
  4. Verificar restrições de patrimônio histórico com `getBensTombados(setor, quadra, lote)` e `getEnvoltoriaTombamento(minx, miny, maxx, maxy)`.
  5. Checar potenciais passivos ambientais com `getAreasContaminadas` e riscos de encosta/inundação com `getRiscosGeologicos`.
  6. Para qualquer outra camada técnica (ex: melhoramentos viários, faixas não edificáveis, mananciais, linhas de metrô), use `queryLayer` passando o nome técnico da camada e o filtro CQL.

## Maintainer notes

Verified 2026-11-11, logged out. The exported spec passed `test/registry.test.ts` and `vetShared`: nine operations, all tier 1 plain HTTP, zero credentials.
All endpoints point to GeoServer WFS at `wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs` using standard OGC WFS 1.0.0 GetFeature with `outputFormat=application/json`.
Live checks verified using historic public landmarks on Avenida Paulista (SQL 009-048-0138 / Av. Paulista 1000) and Vila Cerqueira César (SQL 015-013-0008).
