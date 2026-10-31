"""Refresh the CC BY 4.0 GeoNames directory. Standard-library Python; no API key."""
import json, zipfile, io, urllib.request, datetime
from pathlib import Path
root = Path(__file__).resolve().parent.parent
base = 'https://download.geonames.org/export/dump/'
archive = urllib.request.urlopen(base + 'cities15000.zip', timeout=60).read()
country_text = urllib.request.urlopen(base + 'countryInfo.txt', timeout=60).read().decode()
countries = {}
regions = {'EU':'Europe','AS':'Asia','AF':'Africa','NA':'Americas','SA':'Americas','OC':'Oceania','AN':'Antarctica'}
for line in country_text.splitlines():
    if not line or line.startswith('#'): continue
    f = line.split('\t')
    countries[f[0]] = {'name':f[4], 'region':regions.get(f[8], 'Other'), 'capital':f[5]}
with zipfile.ZipFile(io.BytesIO(archive)) as zipped:
    lines = zipped.read('cities15000.txt').decode().splitlines()
cities = []
for line in lines:
    f = line.split('\t')
    if f[8] not in countries or f[7] == 'PPLX': continue  # Exclude city districts; retain towns and capitals.
    cities.append([int(f[0]), f[1], f[8], round(float(f[4]),4), round(float(f[5]),4), int(f[14] or 0)])
cities.sort(key=lambda row: -row[5])
public = root/'public/data'
public.mkdir(parents=True, exist_ok=True)
(public/'global-cities.json').write_text(json.dumps(cities, ensure_ascii=False, separators=(',',':'))+'\n')
(root/'src/lib/discovery-countries.json').write_text(json.dumps(countries,ensure_ascii=False,separators=(',',':'))+'\n')
metadata = {'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'cities':len(cities), 'countries':len(set(row[2] for row in cities)), 'source':base+'cities15000.zip', 'license':'CC BY 4.0', 'attribution':'GeoNames.org', 'fields':['id','name','countryCode','latitude','longitude','population']}
(root/'src/lib/global-directory-meta.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(metadata)
