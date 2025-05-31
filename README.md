# QuizGenAI

Quiz przygtoowany w tym repozytorium jest częścią badania **"Ocena zdolności multimodalnych modeli GenAI do użytkowania map statystycznych: odczyt, interpretacja, analiza"**
realizowanego w ramach pracy doktorskiej **"Możliwości zastosowania GenAI do opracowania i ewaluacji map statystycznych"**.

Doktorat realizowany jest w **Międzydziedzinowej Szkole Dokotrskiej Uniwersytetu Warszawskiego**.

Opublikowany quiz ma na celu sprawdzenie rozróżnialności odpowiedzi udzielonych przez modele GenAI i odpowidzi udzielonych przez ludzi.

Link do quizu: https://martasolarz.github.io/QuizGenAI/

## Więcej informacji o badaniu "Ocena zdolności multimodalnych modeli GenAI do użytkowania map statystycznych: odczyt, interpretacja, analiza"

### I. Cel badania

- Celem badania jest ocena zdolności multimodalnych modeli generatywnej sztucznej inteligencji (GenAI) do użytkowania map statystycznych.
- Badanie obejmuje analizę ich możliwości w trzech kluczowych obszarach: odczytywanie danych zawartych na mapach, interpretowanie przedstawionych informacji oraz przeprowadzenie ich analizy.
- Uwzględnia zarówno mapy wykorzystywane w raportach instytucji międzynarodowych, jak i te tworzone przez organizacje akademickie i naukowe, co pozwala na zbadanie ich praktycznego zastosowania oraz poprawności kartograficznej.

### II. Pytania badawcze

- Czy modele GenAI potrafią poprawnie odczytywać kluczowe elementy map statystycznych (legendy, skale, symbole, dane liczbowe)? Jakie modele radzą sobie z tym lepiej, a jakie gorzej? Czy znaczenie ma poziom szczegółowości mapy, metoda prezentacji lub źródło mapy?
- Czy modele GenAI są w stanie prawidłowo rozpoznawać i interpretować wzorce oraz relacje przestrzenne ukazane na mapach statystycznych? Jakie modele radzą sobie z tym lepiej, a jakie gorzej? Czy znaczenie ma poziom szczegółowości mapy, metoda prezentacji lub źródło mapy?
- Czy modele GenAI zdolne są do przeprowadzania zaawansowanej analizy danych prezentowanych na mapach statystycznych (uwzględniającej wiedzę kontekstową i ocenę jakości informacji)? Jakie modele radzą sobie z tym lepiej, a jakie gorzej? Czy znaczenie ma poziom szczegółowości mapy, metoda prezentacji lub źródło mapy?

### III. Mapy wykorzystane do badania

| Kod              | Tytuł                                                                 | Źródło                                           |
|------------------|-----------------------------------------------------------------------|--------------------------------------------------|
| SINGLE-G-ATL-1   | Net Migration per 1000 inhabitants in 2014                           | Atlas of Poland’s Political Geography, wyd. 2018 |
| SINGLE-G-ATL-2   | Professionals                                                        | The social atlas of Europe, 2014                |
| SINGLE-G-INST-1  | Share of energy from renewable sources in % of gross final energy consumption, 2017 | CBS                                    |
| SINGLE-D-ATL-1   | People aged 25-64 years with tertiary educational attainment, 2010   | The social atlas of Europe, 2014                |
| SINGLE-D-INST-1  | Harvested production of cereals, 2022                                | Eurostat                                         |
| SINGLE-D-INST-2  | Air passengers, 2019                                                  | Eurostat                                         |
| SINGLE-D-INST-3  | Death rates and main causes of death, 2020                           | Eurostat                                         |
| SINGLE-D-INST-4  | People with at least an upper secondary education qualification, 2021| Eurostat                                         |
| MULTI-G-ATL-1    | Population density in 2016                                            | Atlas of Poland’s Political Geography, wyd. 2018 |
| MULTI-G-ATL-2    | Number of arrests for terrorism in 2014-2015                         | Atlas of Poland’s Political Geography, wyd. 2018 |
| MULTI-G-INST-1   | Maritime freight handled, 2020 and 2021                              | Eurostat                                         |
| MULTI-G-INST-2   | Emission of air pollutions in EU countries in 2015                   | GUS                                              |
| MULTI-G-INST-3   | Confidence in the European Parliament in EU countries in 2016        | GUS                                              |
| MULTI-D-ATL-1    | Acting together                                                      | ESPON Atlas, 2006                                |
| MULTI-D-ATL-2    | MEGAs & competitiveness                                              | ESPON Atlas, 2006                                |
| MULTI-D-ATL-3    | Intensity of co-operation                                            | ESPON Atlas, 2006                                |

### IV. Modele testowane w badaniu

| Firma             | Model                    | Rok publikacji | Miesiąc publikacji | Kraj   |
|-------------------|--------------------------|----------------|--------------------|--------|
| OpenAI            | GPT-4o                   | 2024           | 5                  | USA    |
| OpenAI            | GPT o3                   | 2025           | 1                  | USA    |
| Google DeepMind   | Gemini 1.5 Pro           | 2024           | 9                  | USA    |
| Google DeepMind   | Gemma 3                  | 2025           | 3                  | USA    |
| Anthropic         | Claude 3.5 Sonnet v2     | 2024           | 10                 | USA    |
| Anthropic         | Claude 3.7 Sonnet        | 2025           | 2                  | USA    |
| xAI               | Grok-3                   | 2025           | 2                  | USA    |
| Perplexity        | Sonar                    | 2025           | 2                  | USA    |
| Alibaba Cloud     | Qwen2.5-Max              | 2025           | 1                  | China  |
| DeepSeek          | DeepSeek-R1              | 2025           | 1                  | China  |
| MiniMax           | MiniMax-01               | 2025           | 1                  | China  |
| Mistral           | Mistral Large            | 2024           | 11                 | France |

