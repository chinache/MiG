#!/usr/bin/env python3
"""Generate an editable PPTX, draw.io source, and SVG preview for the flowchart."""
from __future__ import annotations

import html
import math
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path("docs/flowchart")
OUT.mkdir(parents=True, exist_ok=True)

W_PX, H_PX = 1920, 1080
SLIDE_CX, SLIDE_CY = 12192000, 6858000  # 13.333 x 7.5 in, widescreen 16:9
PX_TO_EMU_X = SLIDE_CX / W_PX
PX_TO_EMU_Y = SLIDE_CY / H_PX
FONT = "Microsoft YaHei"
BLUE = "2F6ECB"
BLUE_DARK = "1F5EB5"
BLUE_LIGHT = "EAF2FF"
GREEN = "43A15C"
GREEN_LIGHT = "EAF7ED"
GRAY = "F7F9FC"
GRAY_LINE = "9AA6B2"
DARK = "27364A"


def emu(v: float, axis: str = "x") -> int:
    return int(round(v * (PX_TO_EMU_X if axis == "x" else PX_TO_EMU_Y)))


def ppt_color(c: str) -> str:
    return c.replace("#", "").upper()


nodes = [
    # id, text, x, y, w, h, style
    ("拓客策略", "拓客策略", 35, 430, 135, 58, "blue"),
    ("走访明细", "走访明细", 230, 245, 215, 45, "card"),
    ("云走访系统", "云走访系统", 230, 300, 215, 45, "card"),
    ("客户数据查询平台", "客户数据查询平台", 230, 355, 215, 45, "card"),
    ("星级客户明细", "星级客户明细", 230, 410, 215, 45, "card"),
    ("客户经理龙虎榜", "客户经理龙虎榜", 230, 465, 215, 45, "card"),
    ("同业信息收集平台", "同业信息收集平台", 230, 520, 215, 45, "card"),
    ("分层分类", "分层分类", 505, 430, 145, 58, "blue"),
    ("村级客户明细平台", "村级客户明细平台", 705, 385, 230, 48, "card"),
    ("企微客户星级评价", "企微客户星级评价", 705, 445, 230, 48, "card"),
    ("客户分流", "客户分流", 1010, 430, 145, 58, "blue"),
    ("存款策略", "存款策略", 1260, 275, 145, 58, "blue"),
    ("企业代发清单明细", "企业代发清单明细", 1450, 230, 220, 45, "card"),
    ("点滴APP系统", "点滴APP系统", 1450, 285, 220, 45, "card"),
    ("企微票券系统A", "企微票券系统", 1450, 340, 220, 45, "card"),
    ("存款客户", "存款客户", 1740, 275, 145, 58, "blue"),
    ("员工定期到期明细", "员工定期到期明细", 1790, 175, 220, 45, "card"),
    ("网点到期明细情况", "网点到期明细情况", 1790, 245, 220, 45, "card"),
    ("定期到期反馈系统", "定期到期反馈系统", 1790, 315, 220, 45, "card"),
    ("贷款策略", "贷款策略", 1260, 525, 145, 58, "blue"),
    ("风险信息共享", "风险信息共享", 1450, 475, 220, 45, "card"),
    ("企微票券系统B", "企微票券系统", 1450, 530, 220, 45, "card"),
    ("运营调度平台", "运营调度平台", 1450, 585, 220, 45, "card"),
    ("贷款客户", "贷款客户", 1740, 560, 145, 58, "blue"),
    ("贷款流失反馈系统", "贷款流失反馈系统", 1790, 475, 220, 45, "card"),
    ("到期贷款提前反馈系统", "到期贷款提前反馈系统", 1790, 545, 220, 45, "card"),
    ("实时存款明细", "实时存款明细", 1790, 615, 220, 45, "card"),
    ("实时贷款明细", "实时贷款明细", 1790, 685, 220, 45, "card"),
    ("利率定价测算系统", "利率定价测算系统", 1790, 755, 220, 45, "card"),
    ("考核支撑系统", "考核支撑系统", 780, 865, 500, 55, "green"),
    ("自建绩效系统", "自建绩效系统", 795, 950, 220, 45, "card"),
    ("客户星级大屏", "客户星级大屏", 1045, 950, 220, 45, "card"),
]
node_map = {n[0]: n for n in nodes}


def center(nid: str) -> tuple[float, float]:
    _, _, x, y, w, h, _ = node_map[nid]
    return x + w / 2, y + h / 2


def side(nid: str, side_name: str) -> tuple[float, float]:
    _, _, x, y, w, h, _ = node_map[nid]
    if side_name == "r":
        return x + w, y + h / 2
    if side_name == "l":
        return x, y + h / 2
    if side_name == "t":
        return x + w / 2, y
    return x + w / 2, y + h


connectors = [
    ("拓客策略", "分层分类"),
    ("分层分类", "村级客户明细平台"),
    ("分层分类", "企微客户星级评价"),
    ("村级客户明细平台", "客户分流"),
    ("企微客户星级评价", "客户分流"),
    ("客户分流", "存款策略"),
    ("客户分流", "贷款策略"),
    ("存款策略", "企业代发清单明细"),
    ("存款策略", "点滴APP系统"),
    ("存款策略", "企微票券系统A"),
    ("企业代发清单明细", "存款客户"),
    ("点滴APP系统", "存款客户"),
    ("企微票券系统A", "存款客户"),
    ("贷款策略", "风险信息共享"),
    ("贷款策略", "企微票券系统B"),
    ("贷款策略", "运营调度平台"),
    ("风险信息共享", "贷款客户"),
    ("企微票券系统B", "贷款客户"),
    ("运营调度平台", "贷款客户"),
]

brackets = [
    # x, y1, y2, side, target or None
    (198, 245, 565, "left", "拓客策略"),
    (1740, 175, 360, "right", "存款客户"),
    (1740, 475, 800, "right", "贷款客户"),
]

support_bracket = [(80, 815), (80, 845), (1000, 845), (1000, 865), (1000, 845), (1880, 845), (1880, 815)]


def node_style(style: str) -> tuple[str, str, str, bool]:
    if style == "blue":
        return BLUE, BLUE_DARK, "FFFFFF", True
    if style == "green":
        return GREEN, "3C8D52", "FFFFFF", True
    return GRAY, "D5DBE3", DARK, False


def svg_arrow(x1, y1, x2, y2, color=GRAY_LINE):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#{color}" stroke-width="4" stroke-linecap="round" marker-end="url(#arrow)" />'


def make_svg() -> str:
    parts = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W_PX}" height="{H_PX}" viewBox="0 0 {W_PX} {H_PX}">
<defs>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#1F2D3D" flood-opacity="0.16"/></filter>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#{GRAY_LINE}"/></marker>
</defs>
<rect width="100%" height="100%" fill="#FFFFFF"/>''']
    for a, b in connectors:
        x1, y1 = side(a, "r")
        x2, y2 = side(b, "l")
        parts.append(svg_arrow(x1 + 8, y1, x2 - 8, y2))
    # bottom support bracket
    d = "M " + " L ".join(f"{x} {y}" for x, y in support_bracket)
    parts.append(f'<path d="{d}" fill="none" stroke="#{DARK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
    for x, y1, y2, orient, target in brackets:
        hook = 28 if orient == "left" else -28
        d = f"M {x+hook} {y1} L {x} {y1} L {x} {y2} L {x+hook} {y2}"
        parts.append(f'<path d="{d}" fill="none" stroke="#{DARK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
    for _, text, x, y, w, h, style in nodes:
        fill, stroke, tcolor, bold = node_style(style)
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" ry="12" fill="#{fill}" stroke="#{stroke}" stroke-width="2" filter="url(#shadow)"/>')
        size = 25 if style in ("blue", "green") else 21
        weight = "700" if bold else "500"
        parts.append(f'<text x="{x+w/2}" y="{y+h/2+size/3-2}" font-family="{FONT}, Microsoft YaHei, sans-serif" font-size="{size}" font-weight="{weight}" fill="#{tcolor}" text-anchor="middle">{html.escape(text)}</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def write_drawio():
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for nid, text, x, y, w, h, style in nodes:
        fill, stroke, tcolor, bold = node_style(style)
        style_str = (
            f"rounded=1;whiteSpace=wrap;html=1;arcSize=18;fillColor=#{fill};strokeColor=#{stroke};"
            f"fontColor=#{tcolor};fontFamily=Microsoft YaHei;fontSize={15 if style in ('blue','green') else 13};"
            f"fontStyle={1 if bold else 0};shadow=1;align=center;verticalAlign=middle;spacing=4;"
        )
        cells.append(f'<mxCell id="{escape(nid)}" value="{escape(text)}" style="{style_str}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    eid = 1000
    for a, b in connectors:
        cells.append(f'<mxCell id="e{eid}" value="" style="endArrow=block;html=1;rounded=1;strokeWidth=2.5;strokeColor=#{GRAY_LINE};" edge="1" parent="1" source="{escape(a)}" target="{escape(b)}"><mxGeometry relative="1" as="geometry"/></mxCell>')
        eid += 1
    for x, y1, y2, orient, target in brackets:
        hook = 28 if orient == "left" else -28
        pts = [(x + hook, y1), (x, y1), (x, y2), (x + hook, y2)]
        arr = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in pts)
        cells.append(f'<mxCell id="e{eid}" value="" style="html=1;rounded=0;strokeWidth=2.5;strokeColor=#{DARK};endArrow=none;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><Array as="points">{arr}</Array></mxGeometry></mxCell>')
        eid += 1
    arr = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in support_bracket)
    cells.append(f'<mxCell id="e{eid}" value="" style="html=1;rounded=0;strokeWidth=2.5;strokeColor=#{DARK};endArrow=none;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><Array as="points">{arr}</Array></mxGeometry></mxCell>')
    xml = f'''<mxfile host="app.diagrams.net" modified="2026-06-03T00:00:00.000Z" agent="Codex" version="24.7.17" type="device">
  <diagram id="flowchart" name="绘图1-现代汇报版">
    <mxGraphModel dx="1920" dy="1080" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{W_PX}" pageHeight="{H_PX}" math="0" shadow="0">
      <root>
        {' '.join(cells)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''
    (OUT / "flowchart_redesign.drawio").write_text(xml, encoding="utf-8")


# PPTX Open XML helpers
content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>'''
rels_root = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>'''
pres_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst><p:sldSz cx="{SLIDE_CX}" cy="{SLIDE_CY}" type="wide"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'''
pres_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>'''
empty_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'''
slide_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>'''
slide_layout = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld></p:sldLayout>'''
slide_master = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>'''
master_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>'''
theme_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="MiG"><a:themeElements><a:clrScheme name="MiG"><a:dk1><a:srgbClr val="27364A"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F5EB5"/></a:dk2><a:lt2><a:srgbClr val="F7F9FC"/></a:lt2><a:accent1><a:srgbClr val="2F6ECB"/></a:accent1><a:accent2><a:srgbClr val="43A15C"/></a:accent2><a:accent3><a:srgbClr val="9AA6B2"/></a:accent3><a:accent4><a:srgbClr val="D5DBE3"/></a:accent4><a:accent5><a:srgbClr val="EAF2FF"/></a:accent5><a:accent6><a:srgbClr val="EAF7ED"/></a:accent6><a:hlink><a:srgbClr val="2F6ECB"/></a:hlink><a:folHlink><a:srgbClr val="1F5EB5"/></a:folHlink></a:clrScheme><a:fontScheme name="MiG"><a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:majorFont><a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme><a:fmtScheme name="MiG"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle/></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>'''


def ppt_sp(idx: int, text: str, x: float, y: float, w: float, h: float, style: str) -> str:
    fill, stroke, tcolor, bold = node_style(style)
    font_size = 900 if style in ("blue", "green") else 760
    btag = '<a:b/>' if bold else ''
    return f'''<p:sp><p:nvSpPr><p:cNvPr id="{idx}" name="{escape(text)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y,'y')}"/><a:ext cx="{emu(w)}" cy="{emu(h,'y')}"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="{ppt_color(fill)}"/></a:solidFill><a:ln w="12700"><a:solidFill><a:srgbClr val="{ppt_color(stroke)}"/></a:solidFill></a:ln><a:effectLst><a:outerShdw blurRad="38100" dist="19050" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="1F2D3D"><a:alpha val="16000"/></a:srgbClr></a:outerShdw></a:effectLst></p:spPr><p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="ctr"><a:spAutoFit/></a:bodyPr><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="zh-CN" sz="{font_size}">{btag}<a:solidFill><a:srgbClr val="{ppt_color(tcolor)}"/></a:solidFill><a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:rPr><a:t>{escape(text)}</a:t></a:r><a:endParaRPr lang="zh-CN" sz="{font_size}"/></a:p></p:txBody></p:sp>'''


def ppt_line(idx: int, pts: list[tuple[float, float]], arrow=False, color=GRAY_LINE, width=19050) -> str:
    if len(pts) == 2:
        x1, y1 = pts[0]; x2, y2 = pts[1]
        flip_v = ' flipV="1"' if (x2 - x1) * (y2 - y1) < 0 else ''
        return f'''<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="{idx}" name="Connector {idx}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr><a:xfrm{flip_v}><a:off x="{emu(min(x1,x2))}" y="{emu(min(y1,y2),'y')}"/><a:ext cx="{emu(abs(x2-x1) or 1)}" cy="{emu(abs(y2-y1) or 1,'y')}"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="{width}"><a:solidFill><a:srgbClr val="{ppt_color(color)}"/></a:solidFill>{'<a:tailEnd type="triangle"/>' if arrow else ''}</a:ln></p:spPr></p:cxnSp>'''
    # freeform approximation as multiple editable line segments
    return "".join(ppt_line(idx * 100 + i, [pts[i], pts[i + 1]], False, color, width) for i in range(len(pts) - 1))


def write_pptx():
    sp = ['''<p:sp><p:nvSpPr><p:cNvPr id="2" name="White background"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>''']
    idx = 3
    for a, b in connectors:
        x1, y1 = side(a, "r"); x2, y2 = side(b, "l")
        sp.append(ppt_line(idx, [(x1 + 8, y1), (x2 - 8, y2)], True)); idx += 1
    for x, y1, y2, orient, _ in brackets:
        hook = 28 if orient == "left" else -28
        sp.append(ppt_line(idx, [(x + hook, y1), (x, y1), (x, y2), (x + hook, y2)], False, DARK, 14000)); idx += 1
    sp.append(ppt_line(idx, support_bracket, False, DARK, 14000)); idx += 1
    for _, text, x, y, w, h, style in nodes:
        sp.append(ppt_sp(idx, text, x, y, w, h, style)); idx += 1
    slide_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>{''.join(sp)}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'''
    with zipfile.ZipFile(OUT / "flowchart_redesign.pptx", "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels_root)
        z.writestr("ppt/presentation.xml", pres_xml)
        z.writestr("ppt/_rels/presentation.xml.rels", pres_rels)
        z.writestr("ppt/slides/slide1.xml", slide_xml)
        z.writestr("ppt/slides/_rels/slide1.xml.rels", slide_rels)
        z.writestr("ppt/slideLayouts/slideLayout1.xml", slide_layout)
        z.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", empty_rels)
        z.writestr("ppt/slideMasters/slideMaster1.xml", slide_master)
        z.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", master_rels)
        z.writestr("ppt/theme/theme1.xml", theme_xml)


if __name__ == "__main__":
    (OUT / "flowchart_redesign.svg").write_text(make_svg(), encoding="utf-8")
    write_drawio()
    write_pptx()
    print("Generated:")
    for p in ["flowchart_redesign.pptx", "flowchart_redesign.drawio", "flowchart_redesign.svg"]:
        print(f"- {OUT / p}")
