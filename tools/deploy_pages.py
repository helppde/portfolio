#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把本地作品集发布到 GitHub Pages（helppde/portfolio）。

为什么不用 git push：
  本机访问 github.com:443 被墙，但 api.github.com 可以通，
  所以这里走 GitHub 的 Git Data API 直接建 blob / tree / commit。

用法：
  python tools/deploy_pages.py

做的事：
  1. 跑 tools/build_data.py（content/*.json -> assets/js/data.js）
  2. 把站点复制到 D:\\a本人项目文件\\_portfolio_site，并改写路径：
       - 根目录 index.html = V2（时装版），资源从 assets/ 取
       - v1.html = V1（工业风）
       - 去掉子目录层级，静态托管直接在根域名可用
  3. 通过 API 推送到 GitHub，等 Pages 构建完成，打印链接

前提：本机 gh 已登录（gh auth status）。
"""
import base64
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = r"D:\a本人项目文件\_portfolio_site"
REPO = "helppde/portfolio"
API = "https://api.github.com"
SITE_URL = "https://helppde.github.io/portfolio/"


def sh(cmd):
    return subprocess.run(cmd, cwd=ROOT, shell=True, capture_output=True, text=True)


def token():
    out = subprocess.check_output(["gh", "auth", "token"], text=True).strip()
    if not out:
        raise SystemExit("gh 未登录，先运行：gh auth login")
    return out


TOKEN = token()


def req(method, path, data=None):
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(
        API + path, data=body, method=method,
        headers={
            "Authorization": "Bearer " + TOKEN,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "portfolio-deploy",
        },
    )
    with urllib.request.urlopen(r, timeout=120) as x:
        return json.loads(x.read().decode())


def build_data():
    print("[1/4] 重建 data.js ...")
    py = sys.executable
    r = subprocess.run([py, os.path.join(ROOT, "tools", "build_data.py")],
                       capture_output=True, text=True)
    print("     ", (r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr) else "")


def stage():
    print("[2/4] 复制并改写站点 ...")
    # 清空旧内容，但保留 .git（如果有）
    if os.path.isdir(DST):
        for name in os.listdir(DST):
            if name == ".git":
                continue
            p = os.path.join(DST, name)
            shutil.rmtree(p, ignore_errors=True) if os.path.isdir(p) else os.remove(p)
    else:
        os.makedirs(DST)

    def copy(name):
        shutil.copytree(os.path.join(ROOT, name), os.path.join(DST, name), dirs_exist_ok=True)

    for name in ("assets", "content", "tools"):
        copy(name)
    os.makedirs(os.path.join(DST, "preview"), exist_ok=True)
    shutil.copyfile(os.path.join(ROOT, "v2", "preview", "01-hero.jpg"),
                    os.path.join(DST, "preview", "01-hero.jpg"))
    shutil.copyfile(os.path.join(ROOT, "README.md"), os.path.join(DST, "README.md"))

    # V2 的 css / js / fonts 提到根资源目录
    for sub in ("css", "js", "fonts"):
        shutil.copytree(os.path.join(ROOT, "v2", "assets", sub),
                        os.path.join(DST, "assets", sub), dirs_exist_ok=True)

    # V2 -> 根 index.html
    v2 = open(os.path.join(ROOT, "v2", "index.html"), encoding="utf-8").read()
    v2 = v2.replace('src="../assets/js/data.js"', 'src="assets/js/data.js"')
    v2 = v2.replace('src="../assets/', 'src="assets/')
    v2 = v2.replace('href="../index.html"', 'href="v1.html"')
    open(os.path.join(DST, "index.html"), "w", encoding="utf-8").write(v2)

    # V2 的 JS：图片路径前缀从 ../ 改成空
    p = os.path.join(DST, "assets", "js", "v2.js")
    js = open(p, encoding="utf-8").read().replace("var IMG = '../';", "var IMG = '';", 1)
    open(p, "w", encoding="utf-8").write(js)

    # V1 -> v1.html
    v1 = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    v1 = v1.replace('href="v2/index.html"', 'href="index.html"')
    open(os.path.join(DST, "v1.html"), "w", encoding="utf-8").write(v1)

    # 让 Pages 跳过 Jekyll 处理
    open(os.path.join(DST, ".nojekyll"), "w").write("")
    open(os.path.join(DST, "robots.txt"), "w").write("User-agent: *\nAllow: /\n")


def push():
    print("[3/4] 推送到 GitHub ...")
    files = []
    for dirpath, dirnames, filenames in os.walk(DST):
        dirnames[:] = [d for d in dirnames if d != ".git"]
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            files.append((os.path.relpath(p, DST).replace("\\", "/"), p))
    files.sort()

    try:
        ref = req("GET", "/repos/%s/git/ref/heads/main" % REPO)
        head = ref["object"]["sha"]
        base = req("GET", "/repos/%s/git/commits/%s" % (REPO, head))["tree"]["sha"]
        parents = [head]
    except Exception:
        head, base, parents = None, None, []

    tree = []
    for rel, p in files:
        raw = open(p, "rb").read()
        blob = req("POST", "/repos/%s/git/blobs" % REPO,
                   {"content": base64.b64encode(raw).decode(), "encoding": "base64"})
        tree.append({"path": rel, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    print("     上传 %d 个文件" % len(tree))

    payload = {"tree": tree}
    if base:
        payload["base_tree"] = base
    t = req("POST", "/repos/%s/git/trees" % REPO, payload)
    c = req("POST", "/repos/%s/git/commits" % REPO,
            {"message": "Deploy: %s" % time.strftime("%Y-%m-%d %H:%M"),
             "tree": t["sha"], "parents": parents})
    req("PATCH", "/repos/%s/git/refs/heads/main" % REPO, {"sha": c["sha"], "force": True})
    print("     commit", c["sha"][:10])

    # 首次部署时开启 Pages
    try:
        req("POST", "/repos/%s/pages" % REPO, {"source": {"branch": "main", "path": "/"}})
    except Exception:
        pass

    print("[4/4] 等 Pages 构建 ...")
    for _ in range(24):
        time.sleep(8)
        b = req("GET", "/repos/%s/pages/builds/latest" % REPO)
        if b.get("status") == "built":
            print("     构建完成")
            break
        print("     状态:", b.get("status"))
    print("\n链接：%s" % SITE_URL)


if __name__ == "__main__":
    build_data()
    stage()
    push()
