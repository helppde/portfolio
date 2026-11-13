# -*- coding: utf-8 -*-
"""作品集站点图片处理脚本（可重复运行）。

严格口径（Lead 红线审查后）：
- 只用"画面里没有人"的真实设备照片；出现任何人物（含手部特写）的图一律不选
- EXIF 方向校正、转 sRGB、长边 <=1600px、JPEG q82、单张 < 330KB
- 输出 assets/img/{caseId}-{n}.jpg，并重写 content/images.json
- 找不到干净照片的项目在 images.json 中直接省略该 caseId

运行：
  C:\\Users\\z1553\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\python\\python.exe tools\\prepare_images.py
"""
import io
import json
import os
import sys

from PIL import Image, ImageCms, ImageOps

Image.MAX_IMAGE_PIXELS = None

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = r"D:\a本人项目文件"
OUT_DIR = os.path.join(WORKSPACE, "assets", "img")
JSON_PATH = os.path.join(WORKSPACE, "content", "images.json")

LONG_EDGE = 1600
TARGET_BYTES = 330 * 1024

# (caseId, 源文件相对路径, caption)
SELECTION = [
    # ---- 灵瞳 AI 水域智能监测与救援平台（设备本体/装配，无人物）----
    ("lingtong", r"溺水救援\图片\微信图片_20251003125041_1229_113.jpg", "推进器与浮筒管路总装"),
    ("lingtong", r"溺水救援\图片\微信图片_20251003125035_1221_113.jpg", "直线导轨与3D打印滑台装配"),
    ("lingtong", r"溺水救援\图片\微信图片_20251007014411_1344_113.jpg", "主控舱电路与管路总装"),
    ("lingtong", r"溺水救援\图片\微信图片_20251003124824_1056_113.jpg", "舱盖内侧主控板接线"),
    # ---- 飞救衣 · 救生衣一体化侦察无人机（整机静物）----
    ("feijiuyi", r"飞救衣\图片\微信图片_20251018190857_1430_113.jpg", "救生衣上的一体化侦察无人机"),
    ("feijiuyi", r"飞救衣\图片\微信图片_20251018184858_1409_113.jpg", "四轴机身中心框展开状态"),
    ("feijiuyi", r"飞救衣\图片\微信图片_20251018184853_1403_113.jpg", "地面调试中的整机与救生衣"),
    # ---- 轮船藤壶一体化清理装置（贴壁底盘静物）----
    ("tenghu", r"藤虎清理\图片\微信图片_20260323160215_2923_113.jpg", "履带底盘吸附墙面测试"),
    ("tenghu", r"藤虎清理\图片\微信图片_20260323160228_2932_113.jpg", "贴壁清洁底盘完成装配"),
    # ---- 智能自水降温候车亭（水槽/顶棚结构静物）----
    ("zishuiting", r"自水亭公交站\自水亭\图片\微信图片_20260915135609_182_462.jpg", "水槽与顶棚喷淋结构"),
    # ---- 火灾逃生路径指示装置（楼体模型/亮灯/主控）----
    ("firepath", r"火情路线规划\火情路线规划\图片\微信图片_20261009232746_407_462.jpg", "带指示灯的楼体模型总装"),
    ("firepath", r"火情路线规划\火情路线规划\图片\微信图片_20261009232747_408_462.jpg", "楼体模型分层亮灯演示"),
    ("firepath", r"火情路线规划\火情路线规划\图片\微信图片_20261009232751_411_462.jpg", "主控板与灯带接线"),
    # ---- 游泳圈水面巡航救援装置（水上实测/设备静物）----
    ("swimring", r"游泳圈救援\游泳圈救援\图片\微信图片_20261007155707_610_69.jpg", "救生圈上的推进与主控模块"),
    ("swimring", r"游泳圈救援\游泳圈救援\图片\微信图片_20261007155707_609_69.jpg", "主控板与驱动接线"),
    # ---- 跨障碍擦玻璃机器人（幕墙底面实拍）----
    ("glassclean", r"跨障碍擦玻璃\跨障碍物擦玻璃装置\输出\配图\web_6c50f4b3.jpg", "负压吸附在墙面的擦玻璃机器人"),
    # ---- hero：只保留 1 张最有装置感的现场图 ----
    ("hero", r"项目图片\微信图片_20251120225048_1725_113.jpg", "四轮装置室内场地调试"),
]

SOURCE_SANITIZE = {"肖子谦": "学生实操记录"}


def to_srgb(im):
    icc = im.info.get("icc_profile")
    if icc:
        try:
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            dst = ImageCms.createProfile("sRGB")
            return ImageCms.profileToProfile(im, src, dst, outputMode="RGB")
        except Exception:
            pass
    return im.convert("RGB")


def resize_long_edge(im, long_edge):
    w, h = im.size
    m = max(w, h)
    if m <= long_edge:
        return im
    scale = long_edge / float(m)
    return im.resize((max(1, int(round(w * scale))), max(1, int(round(h * scale)))), Image.LANCZOS)


def save_under_budget(im, path):
    quality = 82
    cur = im
    while True:
        buf = io.BytesIO()
        cur.save(buf, format="JPEG", quality=quality, optimize=True, progressive=False)
        data = buf.getvalue()
        if len(data) <= TARGET_BYTES:
            with open(path, "wb") as f:
                f.write(data)
            return cur.size, len(data)
        if quality > 72:
            quality -= 4
            continue
        nw, nh = max(1, int(cur.width * 0.9)), max(1, int(cur.height * 0.9))
        cur = cur.resize((nw, nh), Image.LANCZOS)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)

    for dirpath, _, filenames in os.walk(OUT_DIR):
        for fn in filenames:
            if fn.lower().endswith(".jpg"):
                os.remove(os.path.join(dirpath, fn))

    manifest = {}
    counters = {}
    for case_id, rel_src, caption in SELECTION:
        src = os.path.join(ROOT, rel_src)
        if not os.path.isfile(src):
            raise SystemExit("缺少源文件: " + src)
        counters[case_id] = counters.get(case_id, 0) + 1
        name = "{}-{}.jpg".format(case_id, counters[case_id])
        out_path = os.path.join(OUT_DIR, name)

        im = Image.open(src)
        im = ImageOps.exif_transpose(im)
        im = to_srgb(im)
        im = resize_long_edge(im, LONG_EDGE)
        (w, h), nbytes = save_under_budget(im, out_path)

        src_rel = rel_src
        for k, v in SOURCE_SANITIZE.items():
            src_rel = src_rel.replace(k, v)

        manifest.setdefault(case_id, []).append({
            "file": "assets/img/" + name,
            "w": w,
            "h": h,
            "caption": caption,
            "source": src_rel.replace("/", "\\"),
        })
        print("OK {} {}x{} {:.0f}KB".format(name, w, h, nbytes / 1024.0))

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump({"images": manifest}, f, ensure_ascii=False, indent=2)
    total = sum(len(v) for v in manifest.values())
    print("DONE cases={} images={} json={}".format(len(manifest), total, JSON_PATH))


if __name__ == "__main__":
    sys.exit(main())
