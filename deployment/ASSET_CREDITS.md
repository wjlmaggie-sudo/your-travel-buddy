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
