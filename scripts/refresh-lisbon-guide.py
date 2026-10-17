import urllib.request,urllib.parse,json,re,time
from html import unescape
names=['Alfama','Lisbon Cathedral','São Jorge Castle','Praça do Comércio','Santa Justa Lift','Chiado','Jerónimos Monastery','Belém Tower','Sintra National Palace','Quinta da Regaleira','Carmo Convent','Time Out Market Lisboa','Pena Palace']
params={'action':'query','titles':'|'.join(names),'redirects':'1','colimit':'max','prop':'coordinates|pageimages|extracts|info','piprop':'thumbnail|name','pithumbsize':'700','exintro':'1','explaintext':'1','exsentences':'2','inprop':'url','format':'json','origin':'*'}
def get(host,params):
 req=urllib.request.Request(host+'?'+urllib.parse.urlencode(params),headers={'User-Agent':'AITravel/1.0 (personal open-source travel planner)'})
 return json.load(urllib.request.urlopen(req,timeout=25))
data=get('https://en.wikipedia.org/w/api.php',params)
pages=[p for p in data['query']['pages'].values() if p.get('coordinates')]
images=[p['pageimage'] for p in pages if p.get('pageimage')]
meta=get('https://commons.wikimedia.org/w/api.php',{'action':'query','titles':'|'.join('File:'+i for i in images),'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':'700','format':'json','origin':'*'})
image_by_name={p['title'][5:].replace('_',' '):p.get('imageinfo',[{}])[0] for p in meta['query']['pages'].values()}
out=[]
for p in pages:
 coord=p['coordinates'][0]
 place={'name':p['title'],'lat':coord['lat'],'lon':coord['lon'],'description':p.get('extract','').split('\n')[0][:380],'source':p['fullurl']}
 ii=image_by_name.get(p.get('pageimage','').replace('_',' '),{})
 ext=ii.get('extmetadata',{})
 def clean(k):return unescape(re.sub('<[^>]+>','',ext.get(k,{}).get('value',''))).strip()[:250]
 license=clean('LicenseShortName')
 if ii.get('thumburl') and (license.startswith('CC') or license in ['Public domain','PD']):
  place['image']={'url':ii['thumburl'],'credit':clean('Artist') or 'Wikimedia Commons contributor','license':license,'source':ii['descriptionurl']}
 out.append(place)
with open('src/lib/lisbon-places.json','w') as f:json.dump(out,f,ensure_ascii=False,indent=2);f.write('\n')
print(json.dumps([{'name':p['name'],'photo':bool(p.get('image'))} for p in out],ensure_ascii=False))
