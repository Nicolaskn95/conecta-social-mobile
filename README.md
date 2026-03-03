## Requisitos Funcionais

Estes requisitos focam na operação de campo e gestão de estoque, utilizando a estrutura de dados já existente na API.

| Código | Requisito | Descrição
|:--- |:--- |:---
| **RF-L01** | **Atualização de Inventário** | O usuário deve poder atualizar a quantidade atual de um item após conferência física no depósito.
| **RF-L02** | **Filtro por Atributos Físicos** | O sistema deve permitir filtrar doações por tamanho e gênero para agilizar a montagem de kits para famílias.
| **RF-L03** | **Consulta de Unidade de Medida** | O app deve exibir a unidade de medida da categoria para evitar erros de entrada (ex: Kg vs Unidades).
| **RF-L04** | **Registro de Logs de Operação** | O voluntário deve registrar mensagens sobre o estado da triagem ou movimentação de itens.
| **RF-L05** | **Alteração de Disponibilidade** | Deve ser possível marcar um item como indisponível caso ele precise de reparo ou higienização.
| **RF-L06** | **Rastreabilidade de Doadores** | Exibição do nome do doador para identificar a origem de lotes específicos durante a triagem.
| **RF-L07** | **Vínculo com Eventos** | Possibilidade de associar a atividade de logística a um evento específico de arrecadação ou entrega.

> **Nota:** O acesso a estas funcionalidades é restrito a usuários autenticados com perfis `ADMIN`, `MANAGER` ou `VOLUNTEER`, utilizando o sistema de permissões via JWT já implementado.

## Requisitos Não Funcionais

| Código | Requisito | Descrição |
|:--- |:--- |:--- |
| **RNF-L01** | **Sincronização Offline** | O app deve permitir o registro de movimentações de estoque sem internet e sincronizar os dados ao detectar rede. |
| **RNF-L02** | **Segurança JWT** | Toda comunicação com a API deve ser autenticada via token JWT, respeitando os níveis de acesso já existentes. |
| **RNF-L03** | **Interface de Alto Contraste** | O design deve facilitar a leitura em ambientes de galpão/depósito com iluminação precária (suporte a Dark Mode). |
| **RNF-L04** | **Baixo Consumo de Dados** | As listagens de doações devem utilizar paginação rigorosa para evitar o consumo excessivo de dados móveis em campo. |
| **RNF-L05** | **Compatibilidade Cross-Platform** | O aplicativo deve ser desenvolvido em tecnologia híbrida React Native para rodar em Android e iOS. |
| **RNF-L06** | **Persistência Local** | Cache local de categorias e tipos de doação para garantir rapidez na navegação e filtragem. |
| **RNF-L07** | **Integridade de Dados** | O sistema deve garantir que operações de decremento de estoque não resultem em quantidades negativas. |