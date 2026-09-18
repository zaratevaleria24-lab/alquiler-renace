#!/usr/bin/env python3
"""Auditoría HTTP reproducible; no certifica indexación ni posiciones en Google.
Uso: python3 scripts/auditar-seo.py [origen] [directorio de evidencias]
Canonical esperado siempre de producción, incluso al probar un build local.
"""
import concurrent.futures, collections, json, pathlib, re, sys, time
import urllib.request, urllib.error, urllib.parse, xml.etree.ElementTree as ET
from html.parser import HTMLParser
BASE = (sys.argv[1] if len(sys.argv)>1 else 'https://margaritarenace.com.ve').rstrip('/')
OUT = pathlib.Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/margarita-seo')
PROD = 'https://margaritarenace.com.ve'
OUT.mkdir(parents=True, exist_ok=True)
class Parser(HTMLParser):
 def __init__(self):
  super().__init__(); self.title=''; self.h1=[]; self.meta={}; self.links=[]; self.canonical=[]; self.images=[]; self.jsonld=[]; self.active=None; self.ld=False; self.buf=''; self.lang=None
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='html': self.lang=d.get('lang')
  if t in ('h1','title'): self.active=t
  if t=='h1': self.h1.append('')
  if t=='meta': self.meta.setdefault(d.get('name',d.get('property','')),[]).append(d.get('content',''))
  if t=='link' and d.get('rel')=='canonical':self.canonical.append(d.get('href'))
  if t=='a' and d.get('href'):self.links.append(d['href'])
  if t=='img':self.images.append(d)
  if t=='script':self.ld=d.get('type')=='application/ld+json';self.buf=''
 def handle_data(self,d):
  if self.active=='title':self.title+=d
  if self.active=='h1':self.h1[-1]+=d
  if self.ld:self.buf+=d
 def handle_endtag(self,t):
  if t==self.active:self.active=None
  if t=='script' and self.ld:
   try:self.jsonld.append(json.loads(self.buf))
   except ValueError:self.jsonld.append({'ERROR':'invalid JSON'})
   self.ld=False

def fetch(path):
 start=time.monotonic();url=BASE+path
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'MargaritaAuditBot/2.0 (SEO verification; no analytics)'})
  try:r=urllib.request.urlopen(req,timeout=30)
  except urllib.error.HTTPError as e:r=e
  ttfb=round((time.monotonic()-start)*1000);body=r.read();p=Parser()
  if 'text/html' in r.headers.get('content-type',''):p.feed(body.decode('utf-8','replace'))
  return {'path':path,'status':r.status,'final':r.url,'ttfb_ms':ttfb,'html_bytes':len(body),'title':p.title,'h1':p.h1,'meta':p.meta,'canonical':p.canonical,'links':p.links,'images':p.images,'jsonld':p.jsonld,'lang':p.lang,'xrobots':r.headers.get('X-Robots-Tag',''),'body':body.decode('utf-8','replace') if path in ['/robots.txt','/sitemap.xml'] else ''}
 except Exception as e:return {'path':path,'error':str(e)}

errors=[];warnings=[]
def check(ok,subject,message):
 if not ok:errors.append({'url':subject,'issue':message})
robots=fetch('/robots.txt');sitemap=fetch('/sitemap.xml')
check(robots.get('status')==200,'/robots.txt','HTTP no es 200')
check(sitemap.get('status')==200,'/sitemap.xml','HTTP no es 200')
xml=ET.fromstring(sitemap.get('body',''))
urls=[e.text for e in xml.findall('.//{*}loc')]
check(len(urls)==len(set(urls)),'/sitemap.xml','URLs duplicadas')
check(all(u.startswith(PROD+'/') for u in urls),'/sitemap.xml','Origen no canónico')
paths=[urllib.parse.urlsplit(u).path or '/' for u in urls]
extras=['/guia?c=playa','/guia?utm_source=auditoria','/guia/lugar-inexistente-auditoria','/no-existe-auditoria-seo','/propiedad/studio-centro-porlamar','/propiedad/apartamento-costa-azul','/enlaces']
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:data=list(pool.map(fetch,dict.fromkeys(paths+extras)))
by_path={r['path']:r for r in data}
# Reglas Allow/Disallow por coincidencia más larga, como en Google. Soporta
# grupos con varios agentes y comodines; Allow gana un empate.
def allowed(agent,path):
 groups=[];agents=[];rules=[]
 for raw in robots.get('body','').splitlines()+['User-agent: __end__']:
  line=raw.split('#')[0].strip()
  if ':' not in line:continue
  k,v=line.split(':',1);k=k.strip().lower();v=v.strip()
  if k=='user-agent':
   if rules:groups.append((agents,rules));agents=[];rules=[]
   agents.append(v.lower())
  elif k in ('allow','disallow') and v:rules.append((k,v))
 specific=[(a,r) for a,r in groups if any(x!='*' and x in agent.lower() for x in a)]
 selected=specific or [(a,r) for a,r in groups if '*' in a]
 matches=[]
 for _,rr in selected:
  for kind,pattern in rr:
   regex='^'+re.escape(pattern).replace(r'\*','.*').replace(r'\$','$')
   if re.search(regex,path):matches.append((len(pattern.replace('*','').rstrip('$')),kind=='allow'))
 return max(matches)[1] if matches else True

def normalize(u):return u.rstrip('/')
def noindex(r):return 'noindex' in (str(r.get('meta',{}).get('robots',[]))+str(r.get('meta',{}).get('googlebot',[]))+r.get('xrobots','')).lower()
for path in paths:
 r=by_path[path];check(r.get('status')==200,path,'Página del sitemap no devuelve 200')
 if 'error' in r:continue
 check(urllib.parse.urlsplit(r['final']).path.rstrip('/')==path.rstrip('/'),path,'URL del sitemap redirige')
 check(len(r['canonical'])==1 and normalize(r['canonical'][0])==normalize(PROD+path),path,'Canonical ausente, duplicado o diferente')
 check(not noindex(r),path,'URL del sitemap tiene noindex')
 check(allowed('Googlebot',path),path,'robots.txt bloquea Googlebot')
 check(bool(r['title'].strip()),path,'Falta título')
 check(len(r['h1'])==1 and bool(r['h1'][0].strip()),path,'Falta H1 único')
 check(len(r['meta'].get('description',[]))==1 and bool(r['meta']['description'][0].strip()),path,'Falta descripción única')
 check(bool(r['lang']) and r['lang'].startswith('es'),path,'Idioma HTML incorrecto')
 check(bool(r['jsonld']) and not any('ERROR' in j for j in r['jsonld']),path,'JSON-LD ausente o sintaxis inválida')
 for img in r['images']:
  check('alt' in img,path,'Imagen sin atributo alt')
  src=urllib.parse.urlsplit(urllib.parse.urljoin(PROD,img.get('src','')))
  if src.netloc==urllib.parse.urlsplit(PROD).netloc:check(allowed('Googlebot',src.path),path,'robots bloquea imagen '+src.path)
 if len(r['title'])>85:warnings.append({'url':path,'issue':'Título largo: revisión editorial, no error de Google','length':len(r['title'])})
for field in ['title','description']:
 values=collections.defaultdict(list)
 for path in paths:
  r=by_path[path];v=r.get('title') if field=='title' else (r.get('meta',{}).get('description') or [''])[0]
  if v:values[v].append(path)
 for value,pp in values.items():check(len(pp)==1,pp,field+' duplicado')
# Alcance desde inicio siguiendo enlaces HTML. No se ejecuta JavaScript.
def internal_path(href,origin):
 u=urllib.parse.urlsplit(urllib.parse.urljoin(PROD+origin,href))
 return (u.path.rstrip('/') or '/') if u.netloc==urllib.parse.urlsplit(PROD).netloc and not u.query else None
seen={'/'};pending=['/']
while pending:
 current=pending.pop()
 for href in by_path.get(current,{}).get('links',[]):
  target=internal_path(href,current)
  if target in by_path and target not in seen:seen.add(target);pending.append(target)
for path in paths:check(path in seen,path,'No alcanzable desde inicio por enlaces HTML rastreados')
for path,status in [('/no-existe-auditoria-seo',404),('/guia/lugar-inexistente-auditoria',404),('/propiedad/studio-centro-porlamar',410)]:check(by_path[path].get('status')==status,path,'Estado esperado '+str(status))
check(noindex(by_path['/guia?c=playa']),'/guia?c=playa','Filtro debería conservar noindex')
check(not noindex(by_path['/guia?utm_source=auditoria']),'/guia?utm_source=auditoria','UTM no debe desindexar la guía')
check(by_path['/propiedad/apartamento-costa-azul'].get('final','').endswith('/propiedad/bahia-magica'),'/propiedad/apartamento-costa-azul','Redirección histórica incorrecta')
# Revisar destinos internos HTML fuera del sitemap para detectar enlaces rotos.
linked=set()
for path in paths:
 for href in by_path[path].get('links',[]):
  target=internal_path(href,path)
  if target and target not in by_path and not target.startswith(('/admin','/api/','/contrato/','/uploads/','/cdn-cgi/')) and not re.search(r'\.[a-zA-Z0-9]{2,5}$',target):linked.add(target)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:other=list(pool.map(fetch,sorted(linked)))
for r in other:check(r.get('status',500)<400,r['path'],'Enlace interno roto')
summary={'base':BASE,'sitemap_urls':len(urls),'pages_checked':len(data)+len(other),'reachable_sitemap_urls':len(set(paths)&seen),'errors':errors,'warnings':warnings,'note':'Comprueba respuestas HTTP y HTML, no indexación real, elegibilidad de rich results ni rankings.'}
(OUT/'rastreo.json').write_text(json.dumps(data+other,ensure_ascii=False,indent=2))
(OUT/'robots.txt').write_text(robots.get('body',''));(OUT/'sitemap.xml').write_text(sitemap.get('body',''))
(OUT/'resumen.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps({**summary, 'errors': errors[:12], 'error_count': len(errors), 'warnings': warnings[:5], 'warning_count': len(warnings)},ensure_ascii=False,indent=2));sys.exit(bool(errors))
