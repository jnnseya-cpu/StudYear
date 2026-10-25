/* StudYear export helper — real Office/PDF files, no dependencies, static-safe.
   Produces genuine OOXML packages (.xlsx / .docx / .pptx) via a tiny stored-ZIP
   writer, and PDF via the browser print pipeline. Every report, document and
   presentation across the OS routes through here.
     SYExport.excel(filename, sheets)   sheets:[{name, rows:[[cell,...],...]}]
     SYExport.word(filename, doc)       doc:{title, blocks:[{h}|{p}|{table:{headers,rows}}]}
     SYExport.ppt(filename, slides)     slides:[{title, bullets:[...], subtitle}]
     SYExport.pdf(title, bodyHtml)      opens a print view (Save as PDF)
     SYExport.menu(btn, builders)       popover offering Excel/Word/PDF/PowerPoint */
(function(){
  'use strict';
  var enc=new TextEncoder();
  function bytes(s){return enc.encode(s)}
  var crcTable=(function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t})();
  function crc32(u8){var c=0xFFFFFFFF;for(var i=0;i<u8.length;i++)c=crcTable[(c^u8[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]})}

  /* ---- minimal stored (uncompressed) ZIP ---- */
  function zip(files){
    var parts=[],central=[],offset=0;
    function u16(n){return [n&0xFF,(n>>>8)&0xFF]}
    function u32(n){return [n&0xFF,(n>>>8)&0xFF,(n>>>16)&0xFF,(n>>>24)&0xFF]}
    files.forEach(function(f){
      var data=typeof f.data==='string'?bytes(f.data):f.data;
      var name=bytes(f.name),crc=crc32(data),size=data.length;
      var local=[].concat(u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(size),u32(size),u16(name.length),u16(0));
      parts.push(new Uint8Array(local),name,data);
      var cd=[].concat(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(size),u32(size),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset));
      central.push(new Uint8Array(cd),name);
      offset+=30+name.length+size;
    });
    var cdStart=offset,cdLen=0;central.forEach(function(c){cdLen+=c.length});
    var end=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cdLen),u32(cdStart),u16(0)));
    return new Blob(parts.concat(central,[end]),{type:'application/octet-stream'});
  }
  function download(blob,filename){
    try{var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url)},4000);return true}catch(e){return false}
  }

  /* ---- XLSX ---- */
  function colRef(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26}return s}
  function excel(filename,sheets){
    sheets=sheets&&sheets.length?sheets:[{name:'Sheet1',rows:[]}];
    var ctOverrides='',wbSheets='',wbRels='',files=[];
    sheets.forEach(function(sh,si){
      var idx=si+1;var rowsXml='';
      (sh.rows||[]).forEach(function(row,ri){
        var cells='';(row||[]).forEach(function(val,ci){
          var ref=colRef(ci)+(ri+1);
          if(val!=null&&val!==''&&!isNaN(val)&&typeof val!=='boolean'&&String(val).trim()!==''&&/^-?\d+(\.\d+)?$/.test(String(val)))
            cells+='<c r="'+ref+'"><v>'+val+'</v></c>';
          else cells+='<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+esc(val)+'</t></is></c>';
        });
        rowsXml+='<row r="'+(ri+1)+'">'+cells+'</row>';
      });
      files.push({name:'xl/worksheets/sheet'+idx+'.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+rowsXml+'</sheetData></worksheet>'});
      ctOverrides+='<Override PartName="/xl/worksheets/sheet'+idx+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      wbSheets+='<sheet name="'+esc((sh.name||('Sheet'+idx)).slice(0,31))+'" sheetId="'+idx+'" r:id="rId'+idx+'"/>';
      wbRels+='<Relationship Id="rId'+idx+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+idx+'.xml"/>';
    });
    files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+ctOverrides+'</Types>'});
    files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
    files.push({name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+wbSheets+'</sheets></workbook>'});
    files.push({name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+wbRels+'</Relationships>'});
    return download(zip(files),filename.replace(/\.xlsx?$/i,'')+'.xlsx');
  }

  /* ---- DOCX ---- */
  function word(filename,doc){
    doc=doc||{};var body='';
    function para(text,style){return '<w:p>'+(style?'<w:pPr><w:pStyle w:val="'+style+'"/></w:pPr>':'')+'<w:r><w:t xml:space="preserve">'+esc(text)+'</w:t></w:r></w:p>'}
    if(doc.title)body+='<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="40"/></w:rPr><w:t xml:space="preserve">'+esc(doc.title)+'</w:t></w:r></w:p>';
    (doc.blocks||[]).forEach(function(b){
      if(b.h!=null)body+='<w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve">'+esc(b.h)+'</w:t></w:r></w:p>';
      else if(b.p!=null)body+=para(b.p);
      else if(b.table){
        var t=b.table;var rows='';
        function cell(v,bold){return '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:r>'+(bold?'<w:rPr><w:b/></w:rPr>':'')+'<w:t xml:space="preserve">'+esc(v)+'</w:t></w:r></w:p></w:tc>'}
        if(t.headers)rows+='<w:tr>'+t.headers.map(function(h){return cell(h,true)}).join('')+'</w:tr>';
        (t.rows||[]).forEach(function(r){rows+='<w:tr>'+r.map(function(c){return cell(c)}).join('')+'</w:tr>'});
        body+='<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/></w:tblBorders></w:tblPr>'+rows+'</w:tbl><w:p/>';
      }
    });
    var docXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr/></w:body></w:document>';
    var files=[
      {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},
      {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
      {name:'word/document.xml',data:docXml}
    ];
    return download(zip(files),filename.replace(/\.docx?$/i,'')+'.docx');
  }

  /* ---- PPTX ---- */
  function ppt(filename,slides){
    slides=slides&&slides.length?slides:[{title:'Slide',bullets:[]}];
    var files=[],slideRefs='',prRels='',ctOverrides='';
    slides.forEach(function(s,i){
      var n=i+1;
      var bodyPara=(s.bullets||[]).map(function(b){return '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-GB" dirty="0"/><a:t>'+esc(b)+'</a:t></a:r></a:p>'}).join('')||'<a:p><a:endParaRPr/></a:p>';
      var subtitle=s.subtitle?'<a:p><a:r><a:rPr lang="en-GB" sz="1400" i="1"/><a:t>'+esc(s.subtitle)+'</a:t></a:r></a:p>':'';
      var slideXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree>'+
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>'+
        '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>'+
        '<p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="8229600" cy="1143000"/></a:xfrm></p:spPr>'+
        '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-GB" sz="2800" b="1"/><a:t>'+esc(s.title||('Slide '+n))+'</a:t></a:r></a:p>'+subtitle+'</p:txBody></p:sp>'+
        '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>'+
        '<p:spPr><a:xfrm><a:off x="457200" y="1600200"/><a:ext cx="8229600" cy="4525963"/></a:xfrm></p:spPr>'+
        '<p:txBody><a:bodyPr/><a:lstStyle/>'+bodyPara+'</p:txBody></p:sp>'+
        '</p:spTree></p:cSld><p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sld>';
      files.push({name:'ppt/slides/slide'+n+'.xml',data:slideXml});
      files.push({name:'ppt/slides/_rels/slide'+n+'.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>'});
      ctOverrides+='<Override PartName="/ppt/slides/slide'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
      slideRefs+='<p:sldId id="'+(255+n)+'" r:id="rId'+n+'"/>';
      prRels+='<Relationship Id="rId'+n+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+n+'.xml"/>';
    });
    var layoutRelId='rId'+(slides.length+1),themeRelId='rId'+(slides.length+2);
    prRels+='<Relationship Id="'+layoutRelId+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>';
    prRels+='<Relationship Id="'+themeRelId+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>';
    var theme='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="StudYear"><a:themeElements><a:clrScheme name="StudYear"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="0B1220"/></a:dk2><a:lt2><a:srgbClr val="EDF1F8"/></a:lt2><a:accent1><a:srgbClr val="4FA6E0"/></a:accent1><a:accent2><a:srgbClr val="2E6BC4"/></a:accent2><a:accent3><a:srgbClr val="5CBB7B"/></a:accent3><a:accent4><a:srgbClr val="C98500"/></a:accent4><a:accent5><a:srgbClr val="A9CFF2"/></a:accent5><a:accent6><a:srgbClr val="E66767"/></a:accent6><a:hlink><a:srgbClr val="4FA6E0"/></a:hlink><a:folHlink><a:srgbClr val="2E6BC4"/></a:folHlink></a:clrScheme><a:fontScheme name="StudYear"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>';
    var layout='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="obj" preserve="1"><p:cSld name="Title and Content"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';
    var master='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>';
    files.push({name:'ppt/slideLayouts/slideLayout1.xml',data:layout});
    files.push({name:'ppt/slideLayouts/_rels/slideLayout1.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>'});
    files.push({name:'ppt/slideMasters/slideMaster1.xml',data:master});
    files.push({name:'ppt/slideMasters/_rels/slideMaster1.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>'});
    files.push({name:'ppt/theme/theme1.xml',data:theme});
    files.push({name:'ppt/presentation.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="'+layoutRelId+'"/></p:sldMasterIdLst><p:sldIdLst>'+slideRefs+'</p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'});
    files.push({name:'ppt/_rels/presentation.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+prRels+'</Relationships>'});
    files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'+ctOverrides+'<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>'});
    files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>'});
    return download(zip(files),filename.replace(/\.pptx?$/i,'')+'.pptx');
  }

  /* ---- PDF via print ---- */
  function pdf(title,bodyHtml){
    var w=window.open('','_blank');
    if(!w){alert('Allow pop-ups to export PDF, or use Print → Save as PDF.');return false}
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font-family:Georgia,serif;color:#111;max-width:900px;margin:26px auto;padding:0 24px;line-height:1.5}h1{font-size:26px}h2{font-size:18px;margin-top:26px;border-bottom:2px solid #2E6BC4;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:10px;font-family:Arial,sans-serif;font-size:12.5px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#eef3fb}.meta{color:#555;font-size:13px}@media print{.noprint{display:none}}</style></head><body>'+bodyHtml+'<div class="noprint" style="margin-top:24px"><button onclick="window.print()" style="padding:10px 18px;font-size:14px;border-radius:8px;border:0;background:#2E6BC4;color:#fff;cursor:pointer">Save as PDF / Print</button></div><script>setTimeout(function(){window.print()},350)<\/script></body></html>');
    w.document.close();return true;
  }

  /* ---- format-picker popover ---- */
  function menu(btn,builders){
    var old=document.getElementById('sy-exp-menu');if(old)old.remove();
    var m=document.createElement('div');m.id='sy-exp-menu';
    m.style.cssText='position:absolute;z-index:9999;background:#101B33;border:1px solid #3D8FD1;border-radius:10px;padding:6px;box-shadow:0 12px 34px rgba(0,0,0,.5);min-width:190px';
    var opts=[['📊 Excel (.xlsx)','excel'],['📄 Word (.docx)','word'],['📕 PDF','pdf'],['📈 PowerPoint (.pptx)','ppt']];
    opts.forEach(function(o){if(!builders[o[1]])return;
      var b=document.createElement('button');b.textContent=o[0];
      b.style.cssText='display:block;width:100%;text-align:left;background:none;border:0;color:#EDF1F8;font:500 13px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:9px 12px;border-radius:7px;cursor:pointer';
      b.onmouseover=function(){b.style.background='rgba(77,157,224,.14)'};b.onmouseout=function(){b.style.background='none'};
      b.onclick=function(){m.remove();try{builders[o[1]]()}catch(e){alert('Export failed: '+e.message)}};
      m.appendChild(b);
    });
    document.body.appendChild(m);
    var r=btn.getBoundingClientRect();
    m.style.top=(r.bottom+window.scrollY+6)+'px';m.style.left=(r.left+window.scrollX)+'px';
    setTimeout(function(){document.addEventListener('click',function h(e){if(!m.contains(e.target)&&e.target!==btn){m.remove();document.removeEventListener('click',h)}})},0);
  }

  window.SYExport={zip:zip,download:download,excel:excel,word:word,ppt:ppt,pdf:pdf,menu:menu};
})();
