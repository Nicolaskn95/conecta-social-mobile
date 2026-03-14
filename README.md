## Requisitos Funcionais

Estes requisitos focam na operação de campo e gestão de estoque, utilizando a estrutura de dados já existente na API.

| Código     | Requisito                         | Descrição                                                                                                    |
| :--------- | :-------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **RF-L01** | **Atualização de Inventário**     | O usuário deve poder atualizar a quantidade atual de um item após conferência física no depósito.            |
| **RF-L02** | **Filtro por Atributos Físicos**  | O sistema deve permitir filtrar doações por tamanho e gênero para agilizar a montagem de kits para famílias. |
| **RF-L03** | **Consulta de Unidade de Medida** | O app deve exibir a unidade de medida da categoria para evitar erros de entrada (ex: Kg vs Unidades).        |
| **RF-L04** | **Registro de Logs de Operação**  | O sistema deve registrar mensagens sobre o estado da triagem ou movimentação de itens.                       |
| **RF-L05** | **Alteração de Disponibilidade**  | Deve ser possível marcar um item como indisponível caso ele precise de reparo ou higienização.               |
| **RF-L06** | **Rastreabilidade de Doadores**   | Exibição do nome do doador para identificar a origem de lotes específicos durante a triagem.                 |
| **RF-L07** | **Vínculo com Eventos**           | Possibilidade de associar a atividade de logística a um evento específico de arrecadação ou entrega.         |

> **Nota:** O acesso a estas funcionalidades é restrito a usuários autenticados com perfis `ADMIN`, `MANAGER` ou `VOLUNTEER`, utilizando o sistema de permissões via JWT já implementado.

## Requisitos Não Funcionais

| Código      | Requisito                          | Descrição                                                                                                           |
| :---------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **RNF-L01** | **Sincronização Offline**          | O app deve permitir o registro de movimentações de estoque sem internet e sincronizar os dados ao detectar rede.    |
| **RNF-L02** | **Segurança JWT**                  | Toda comunicação com a API deve ser autenticada via token JWT, respeitando os níveis de acesso já existentes.       |
| **RNF-L03** | **Interface de Alto Contraste**    | O design deve facilitar a leitura em ambientes de galpão/depósito com iluminação precária (suporte a Dark Mode).    |
| **RNF-L04** | **Baixo Consumo de Dados**         | As listagens de doações devem utilizar paginação rigorosa para evitar o consumo excessivo de dados móveis em campo. |
| **RNF-L05** | **Compatibilidade Cross-Platform** | O aplicativo deve ser desenvolvido em tecnologia híbrida React Native para rodar em Android e iOS.                  |
| **RNF-L06** | **Persistência Local**             | Cache local de categorias e tipos de doação para garantir rapidez na navegação e filtragem.                         |
| **RNF-L07** | **Integridade de Dados**           | O sistema deve garantir que operações de decremento de estoque não resultem em quantidades negativas.               |

## Diretrizes de Design

A **fidelidade visual com o projeto web** ([conecta-social-web](conecta-social-web)) é **obrigatória** para atender ao **RNF-L03 (Interface de Alto Contraste)**. O app deve reproduzir o mesmo padrão de cores, contraste e componentes do front web, garantindo identidade única e leitura em ambientes de galpão/depósito.

### Paleta de cores

A aplicação deve utilizar como referência oficial o arquivo **colors.json** do projeto web: `conecta-social-web/src/core/color/colors.json`. As chaves abaixo devem ser usadas de forma consistente em todo o app.

| Chave                    | Valor     | Uso recomendado                                                  |
| :----------------------- | :-------- | :--------------------------------------------------------------- |
| **primary**              | `#387AA1` | Botões principais, itens ativos na navegação, bordas de destaque |
| **secondary**            | `#4AA1D3` | Bordas de botões primários, links, acentos                       |
| **tertiary**             | `#BCD4E1` | Fundos suaves, divisórias                                        |
| **text**                 | `#090934` | Texto padrão em toda a interface                                 |
| **danger**               | `#A13838` | Botões de exclusão, alertas, ações destrutivas                   |
| **danger_hover**         | `#E1BCBC` | Estado hover/pressed em ações de perigo                          |
| **success**              | `#38A13C` | Confirmações, status positivo                                    |
| **success_light**        | `#BCE1C6` | Fundos de feedback de sucesso                                    |
| **header_sidebar_color** | `#D2E6EF` | Fundo da barra de navegação / sidebar                            |
| **warning_light**        | `#E1D4BC` | Avisos leves, fundos de alerta                                   |

### Uso dos componentes de UI

Para manter o padrão visual do web e o alto contraste (RNF-L03), os componentes devem seguir estas convenções:

| Componente              | Padrão                            | Regras                                                                                                                                         |
| :---------------------- | :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Botão primário**      | `btn-primary`                     | Fundo `primary`, borda `secondary`, texto branco. Uso: ações principais (salvar, confirmar).                                                   |
| **Botão secundário**    | `btn-secondary`                   | Fundo branco, borda `primary`, texto `primary`. Uso: ações secundárias (cancelar, voltar).                                                     |
| **Botão de perigo**     | `btn-danger`                      | Fundo `danger`, texto branco. Uso: exclusão, ações irreversíveis.                                                                              |
| **Card**                | `.card`                           | Borda `primary`, cantos arredondados (ex.: 8–12px), padding consistente. Uso: listagem de itens, blocos de conteúdo.                           |
| **Input**               | `.input`                          | Borda neutra, estado de foco com cor `primary`. Uso: campos de texto, numéricos, seleção.                                                      |
| **Navegação / sidebar** | `.sidebar-color`, `.sidebar-menu` | Fundo `header_sidebar_color`. Item ativo: fundo `primary`, texto branco. Item inativo: texto `primary`. Uso: menu principal, abas, bottom tab. |

Utilize sempre o **theme** (ex.: `src/theme/`) do app para aplicar essas cores e estilos, de forma a facilitar futura adoção de Dark Mode e manutenção alinhada ao web.
