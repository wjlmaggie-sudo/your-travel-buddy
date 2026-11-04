# Travel Buddy asset credits

`src/assets/travel-lake.jpg`: Lago di Braies / “Boathouse on a mountain lake”, Luca Bravo, 9 August 2016. Downloaded as a 1280 px Wikimedia Commons derivative; bundled locally to avoid remote-image loading shifts and third-party dependency on the homepage.

Source and license: https://commons.wikimedia.org/wiki/File:Lago_di_Braies_(Unsplash_VowIFDxogG4).jpg

Original photographer page: https://unsplash.com/photos/VowIFDxogG4

License: Creative Commons CC0 1.0 Universal Public Domain Dedication (original Unsplash publication before 5 June 2017). https://creativecommons.org/publicdomain/zero/1.0/

The homepage applies a CSS crop and contrast overlay; the bundled JPEG is otherwise unchanged. Photo credit is also linked on the hero. Other attraction images retain their existing per-image attribution.

`src/lib/lisbon-map.json`: selected OpenStreetMap street, path, park and water geometries for central Lisbon, Belém and Sintra, retrieved from the OSM map API on 18 October 2026. Source bounding boxes and retrieval date are included in the file. Data © OpenStreetMap contributors, made available under the Open Database License (ODbL) 1.0: https://www.openstreetmap.org/copyright and https://opendatacommons.org/licenses/odbl/1-0/ . The extracted data retains that license. PDF exports render this data as vector maps with visible attribution; they do not bundle raster tiles from OpenStreetMap's interactive tile service.

## Flight airport directory

`src/data/flight-airports.json`: scheduled-service airports with IATA codes, names, municipalities, countries and coordinates, filtered from OurAirports on 24 October 2026. Public-domain data: https://ourairports.com/data/ . Source: https://davidmegginson.github.io/ourairports-data/airports.csv . Loaded only when resolving a flight search; city lookups that need coordinates reuse the existing Open-Meteo geocoder. Airport choices remain editable.

## Curated Lisbon activity photographs — 30 October 2026

These locally served copies are 960-pixel Wikimedia Commons renditions, retained with their original attribution. All seven use [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). No subject or color edits were made; the site crops their presentation in cards.

| Place / local asset | Photographer | Original file and license information |
| --- | --- | --- |
| Jardim da Estrela · `images/lisbon/jardim-estrela.jpg` | GualdimG | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Jardim_da_Estrela_01.jpg) |
| Oceanário de Lisboa · `images/lisbon/oceanario.jpg` | Eugenio Hansen, OFS | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Exterior_of_Ocean%C3%A1rio_de_Lisboa.jpg) |
| Pavilhão do Conhecimento · `images/lisbon/science-pavilion.jpg` | GualdimG | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Pavilh%C3%A3o_do_Conhecimento_01.jpg) |
| Jardim Parque das Nações · `images/lisbon/water-gardens.jpg` | Jules Verne Times Two | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Jardins_de_%C3%81gua,_Parque_das_Na%C3%A7%C3%B5es,_Lisbon,_Portugal_julesvernex2.jpg) |
| Praça do Comércio · `images/lisbon/comercio.jpg` | Berthold Werner | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Lisbon_Pra%C3%A7a_do_Com%C3%A9rcio_BW_2018-10-03_13-33-44.jpg) |
| Alameda dos Oceanos · `images/lisbon/alameda-oceanos.jpg` | Jules Verne Times Two | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Water_volcano,_Alameda_dos_Oceanos,_Parque_das_Na%C3%A7%C3%B5es,_Lisbon,_Portugal_julesvernex2-2.jpg) |
| Vila Sassetti gardens · `images/lisbon/vila-sassetti.jpg` | GualdimG | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Villa_Sassetti_(Sintra)_15.jpg) |

## Worldwide discovery data — 31 October 2026

`public/data/global-cities.json`, `src/lib/discovery-countries.json` and metadata are derived from the [GeoNames free gazetteer](https://www.geonames.org/export/), cities15000/countryInfo snapshot. © GeoNames contributors, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Fields are filtered/reformatted, PPLX districts removed; updater and retrieval timestamp are included in the repository. Nearby activity topic references link [Wikipedia articles](https://en.wikipedia.org/wiki/Wikipedia:Copyrights); no article prose is copied. Geographic search uses the MediaWiki API and returned primary Earth coordinates. Live forecast/historical reference data credits [Open-Meteo](https://open-meteo.com/), CC BY 4.0, under their free non-commercial hosted-service limits. Visible attribution and source links appear in Travel Chatbot.

## Additional bundled Lisbon photographs — V1.0, 2 November 2026

These existing open-licensed itinerary images are now served locally for reliable website and bundled app access. Source renditions are unchanged; card crops use CSS.

| Place / asset | Photographer | License and source |
| --- | --- | --- |
| Alfama · `images/lisbon/landmark-0.jpg` | Arne Müseler | [CC BY-SA 3.0 de](https://commons.wikimedia.org/wiki/File:Lisbon_alfalma.jpg) |
| Belém Tower · `images/lisbon/landmark-1.jpg` | Alvesgaspar | [CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Torre_Bel%C3%A9m_April_2009-4a.jpg) |
| Carmo Convent · `images/lisbon/landmark-2.jpg` | Georges Jansoone | [CC BY 2.5](https://commons.wikimedia.org/wiki/File:Lisbon09.jpg) |
| Chiado · `images/lisbon/landmark-3.jpg` | Luca Galuzzi (Lucag) | [CC BY-SA 2.5](https://commons.wikimedia.org/wiki/File:Lisbon_10064_Lisboa_Pra%C3%A7a_Lu%C3%ADs_de_Cam%C3%B5es_2006_Luca_Galuzzi_(cropped).jpg) |
| Jerónimos Monastery · `images/lisbon/landmark-4.jpg` | Holger Uwe Schmitt | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:1502_legte_K%C3%B6nig_Manuel_I._den_Grundstein_f%C3%BCr_das_Hieronymus_Kloster_in_Lissabon._06.jpg) |
| Lisbon Cathedral · `images/lisbon/landmark-5.jpg` | Diego Delso | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Catedral,_Lisboa,_Portugal,_2022-07-24,_DD_24.jpg) |
| Pena Palace · `images/lisbon/landmark-6.jpg` | Singa Hitam | [CC BY 2.0](https://commons.wikimedia.org/wiki/File:Sintra_-_Palacio_da_Pena_(20332995770).jpg) |
| Santa Justa Lift · `images/lisbon/landmark-7.jpg` | Dicklyon | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Elevador_de_Santa_Justa_from_Rua_de_Santa_Justa.jpg) |
| Sintra National Palace · `images/lisbon/landmark-8.jpg` | Kent Wang | [CC BY 4.0](https://commons.wikimedia.org/wiki/File:Pal%C3%A1cio_Nacional_de_Sintra_from_above_74.jpg) |
| São Jorge Castle · `images/lisbon/landmark-9.jpg` | Wikimedia Commons contributor | [CC BY-SA 2.0](https://commons.wikimedia.org/wiki/File:Castelo_Sao_Jorge_Lisboa_1.JPG) |
| Time Out Market Lisboa · `images/lisbon/landmark-10.jpg` | Paul Arps from The Netherlands | [CC BY 2.0](https://commons.wikimedia.org/wiki/File:Drinks_at_Mercado_da_Ribeira_(Lissabon_2016)_(26003375942).jpg) |

## Shanghai activity photos · 4 November 2026

Directory snapshot from the English Wikipedia coordinate directory around central Shanghai. Local copies retain the original licensed renditions; display crops use CSS. Coordinates gate photo matching so a same-named venue elsewhere never receives a Shanghai photo.

| Place / asset | Photographer | License and source |
| --- | --- | --- |
| Shanghai Grand Theatre · `images/shanghai/shanghai-grand-theatre.jpg` | Coolcaesar | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Shanghaigrandtheatre.jpg) |
| History of Shanghai Art Museum · `images/shanghai/history-of-shanghai-art-museum.jpg` | Art Museum Photographer | [CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:%E7%BE%8E%E6%9C%AF%E9%A6%86%E5%BB%BA%E7%AD%91DSC_9557.JPG) |
| Tomorrow Square · `images/shanghai/tomorrow-square.jpg` | DvTor8303 | [CC0](https://commons.wikimedia.org/wiki/File:Tomorrow_Square_20260417.jpg) |
| People's Square (Shanghai) · `images/shanghai/people-s-square-shanghai.jpg` | Jordiferrer | [CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:People_Square_seen_from_Urban_Planning_Exhibition_Center.JPG) |
| Confucian Temple of Shanghai · `images/shanghai/confucian-temple-of-shanghai.jpg` | https://www.flickr.com/photos/kanegen/ | [CC BY 2.0](https://commons.wikimedia.org/wiki/File:Confucius_Temple_of_Shanghai2.jpg) |
| Yu Garden · `images/shanghai/yu-garden.jpg` | Stefan Fussan | [CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Shanghai_-_Yu_Garden_-_0035.jpg) |
| City God Temple of Shanghai · `images/shanghai/city-god-temple-of-shanghai.jpg` | Legolas1024 | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:%E5%9F%8E%E9%9A%8D%E5%BA%99%C2%B7%E4%B8%8A%E6%B5%B7%E5%8D%97%E5%B8%82.jpg) |
| Shanghai Urban Planning Exhibition Center · `images/shanghai/shanghai-urban-planning-exhibition-center.jpg` | Daniel Case | [CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Shanghai_Urban_Planning_Exhibition_Center_from_northeast.jpg) |
