#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把 content/*.json 合并成浏览器可直接 <script> 加载的 assets/js/data.js。

为什么用 .js 而不是 .json：
  站点要能双击 index.html 离线打开（file:// 协议），
  而 file:// 下 fetch('/content/*.json') 会被 CORS 拦掉；script 标签不会。

用法：
  python tools/build_data.py
修改内容：直接改 content/profile|facts|cases|catalog|images.json，然后重跑本脚本。
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
OUT = os.path.join(ROOT, "assets", "js", "data.js")


def load(name, default):
    path = os.path.join(CONTENT, name)
    if not os.path.exists(path):
        print("  [warn] 缺少 content/%s，使用占位数据" % name)
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    facts = load("facts.json", {"identity": {}, "numbers": [], "capabilities": [],
                                "timeline": [], "strengths": [], "education": {}})
    cases_doc = load("cases.json", {"cases": []})
    catalog = load("catalog.json", {"total": 0, "categories": [], "items": []})
    images_doc = load("images.json", {"images": {}})
    gallery_doc = load("gallery.json", {"items": []})

    images = images_doc.get("images", {})
    cases = cases_doc.get("cases", [])
    gallery = gallery_doc.get("items", [])

    # 把图片清单挂到对应案例上
    for c in cases:
        c["images"] = images.get(c["id"], c.get("images") or [])

    site = {
        "identity": facts.get("identity", {}),
        "numbers": facts.get("numbers", []),
        "capabilities": facts.get("capabilities", []),
        "boundaries": facts.get("boundaries", []),
        "timeline": facts.get("timeline", []),
        "strengths": facts.get("strengths", []),
        "education": facts.get("education", {}),
        "cases": cases,
        "catalog": catalog,
        "gallery": gallery,
        "meta": {
            "caseCount": len(cases),
            "projectTotal": catalog.get("total", len(catalog.get("items", []))),
            "imageCount": sum(len(v) for v in images.values()),
            "galleryCount": len(gallery),
            "builtFrom": "content/*.json",
        },
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    payload = json.dumps(site, ensure_ascii=False, separators=(",", ":"))
    header = (
        "/* 由 tools/build_data.py 自动生成 — 请勿手改。\n"
        "   数据源：content/facts.json · cases.json · catalog.json · images.json\n"
        "   重新生成：python tools/build_data.py */\n"
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("window.SITE = ")
        f.write(payload)
        f.write(";\n")

    print("OK  -> %s (%.1f KB)" % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1024.0))
    print("    案例 %d · 全景 %d · 图片 %d · 能力 %d" % (
        len(cases), catalog.get("total", 0), site["meta"]["imageCount"], len(site["capabilities"])))


if __name__ == "__main__":
    main()
