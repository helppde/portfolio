# -*- coding: utf-8 -*-
"""
构建 content/catalog.json + content/catalog.md（项目全景目录，71 项）

数据源（只读）：D:\\a本人项目文件\\_职业诊断底稿\\01_产品档案.md 第 1 节全景总表
解析：逐行解析 1.1 ~ 1.10 的 markdown 表格，剔除 2 项"非作品"行，得到 71 项装置。
人工压缩：tagline ≤34 字、stack 3–5 个关键词、英文 id、年份取时间列结束年、规模归一化。
自检：行数/分赛道计数/id 唯一/分类计数之和 = total/完成度分布 = 底稿口径(33·13·23·2)/
      tagline 长度/stack 关键词数/规模数字能在原文证据列找到。
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SRC = Path(r"D:\a本人项目文件\_职业诊断底稿\01_产品档案.md")
OUT_JSON = Path(r"D:\a本人项目文件\个人作品集\content\catalog.json")
OUT_MD = Path(r"D:\a本人项目文件\个人作品集\content\catalog.md")

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

# 1.1 ~ 1.10 的赛道名（track）与展示名（category）
TRACK = {
    1: "助老助残",
    2: "消防应急",
    3: "农业",
    4: "环境监测",
    5: "教育",
    6: "交通",
    7: "机器人",
    8: "文化创意",
    9: "生活/消费",
    10: "结构件/Demo",
}
CATEGORY = {
    "助老助残": "助老助残装备",
    "消防应急": "消防应急装备",
    "农业": "农业机器人",
    "环境监测": "环境监测装备",
    "教育": "教育教具",
    "交通": "智慧交通",
    "机器人": "机器人平台",
    "文化创意": "文化创意",
    "生活/消费": "生活消费",
    "结构件/Demo": "结构件/样机",
}
STATUS_LEGEND = {
    "●": "有实物且材料成套",
    "◐": "有实物或样机、材料不全",
    "○": "仅 CAD 或仅代码",
    "△": "仅创意/单页文档",
}
EXPECTED_COUNTS = {1: 9, 2: 7, 3: 8, 4: 12, 5: 7, 6: 5, 7: 9, 8: 4, 9: 5, 10: 5}
EXPECTED_STATUS = {"●": 33, "◐": 13, "○": 23, "△": 2}
TOTAL = 71
TAGLINE_MAX = 34
STACK_MIN, STACK_MAX = 3, 5

# 人工压缩结果，严格按底稿表格出现顺序（1.1 → 1.10），71 条
# 字段：id / tagline（≤34 字）/ stack（3–5 个关键词，·分隔）/ scale（文件数·体积……）
CURATED = [
    # ---- 1.1 助老助残（9） ----
    {"id": "bathwheelchair", "tagline": "电动平躺 + 6 光轴浴花自洗 + 环形喷淋，老人自助洗澡",
     "stack": "单片机 · 电动推杆 · 链条齿轮 · 水泵", "scale": "305 文件 · 240MB · CAD63"},
    {"id": "ivhelper", "tagline": "自动插针 + 余量监测 + 语音暖手三合一，替代护士巡房",
     "stack": "Arduino · 余量检测 · 暖手模块 · 语音", "scale": "92 文件 · 53MB · CAD19"},
    {"id": "blindvest", "tagline": "马甲多向探测中高位障碍与台阶，补盲杖只探地面的短板",
     "stack": "ESP32 · CameraWebServer · K210", "scale": "3062 文件 · 613MB"},
    {"id": "eegglasses", "tagline": "TGAM 脑电判焦虑 → 安抚语音 + 箭头指路 + 4G 推家属",
     "stack": "ESP32-S3 · TGAM 脑电 · ML307C 4G · GPS · OLED", "scale": "567 文件 · 1.68GB · 源码120"},
    {"id": "rehabexo", "tagline": "ESP32-C3 驱动腕臂循环康复，网页调参 + 三段自检",
     "stack": "ESP32-C3 · 舵机 LEDC · 步进 · WiFi WebServer", "scale": "56 文件 · 12MB · CAD53"},
    {"id": "dryingrack", "tagline": "湿度感知判干 + 自动升降风干防过烘，复用外骨骼框架",
     "stack": "ESP32-C3 · 湿度传感 · WiFi WebServer", "scale": "12 文件 · 8.9MB · CAD10"},
    {"id": "smartcane", "tagline": "多传感避障导盲杖，7 件套申报包 + 视频双版本",
     "stack": "多传感避障 · 7 件套申报包 · 视频交付", "scale": ""},
    {"id": "fallalarm", "tagline": "跌倒检测 + 自动求救，视频版与 7 件套申报版双交付",
     "stack": "跌倒检测 · 自动求救 · 双版本交付", "scale": ""},
    {"id": "medtransport", "tagline": "滑轨丝杠自动转运药品，替代人工推车（日均约 200 次）",
     "stack": "ESP32-S3 · L298N · 520 编码电机 · 丝杠滑轨", "scale": "226 文件 · 724MB · CAD55"},
    # ---- 1.2 消防应急（7） ----
    {"id": "lingtong", "tagline": "摄像头 AI 发现溺水 → 算落点 → 自动抛投救生圈闭环",
     "stack": "AI 视觉 · 单/双体船 · 发射仓 · 风速风向 · PS2", "scale": "448 文件 · 1.88GB"},
    {"id": "swimring", "tagline": "游泳圈当浮体做遥控救援器，K210 视觉找人，成本远低于救援艇",
     "stack": "Arduino Nano · L298N · K210 · 超声波", "scale": "211 文件 · 1.11GB · 源码97"},
    {"id": "feijiuyi", "tagline": "救生衣背板一拉展开四机臂，到场即飞省 3~4 分钟",
     "stack": "四旋翼 · 折叠机臂 · 救生衣背板", "scale": "204 文件 · 887MB · 实拍179 张"},
    {"id": "firepath", "tagline": "18 颗灯带按火情改向，跨楼层统一疏散：绿走黄快过红封锁",
     "stack": "ESP32-S3 · DS18B20 · MQ-2 · FastLED", "scale": "169 文件 · 545MB · 源码19"},
    {"id": "kitchenfire", "tagline": "视觉 + 热成像双模识别火焰，横移收纳 + 灭火毯覆盖 + 切燃气",
     "stack": "树莓派 4B · 视觉火焰识别 · TG-300B 推杆", "scale": "33 文件 · 4.9MB · CAD29"},
    {"id": "softrescue", "tagline": "双线柔性驱动 + 软体机械臂抓握，成本远低于 5 万元设备",
     "stack": "Arduino UNO · PS2X · 双推进器 · 270° 舵机", "scale": "91 文件 · 227MB · CAD41"},
    {"id": "floodguard", "tagline": "车位下埋充气围挡，浸水电压过 2.1V 自动升起",
     "stack": "ESP32-C3 · 浸水电压传感 · 继电器 · 气泵", "scale": "97 文件 · 821MB · 源码10"},
    # ---- 1.3 农业（8） ----
    {"id": "greenhouse", "tagline": "4 推杆双自适应调宽调高，K210 病害二分类后定向喷药",
     "stack": "ESP32-S3 · 麦克纳姆轮 · K210 · 云台 · PS2", "scale": "13.9 万文件 · 1.49GB · 84k 训练图"},
    {"id": "soilph", "tagline": "探头逐点测 pH 并按需撒调节剂，替代凭经验撒酸碱",
     "stack": "ESP32-S3 · pH 探头 · 调节剂撒施", "scale": "118 文件 · 737MB · CAD23"},
    {"id": "irrigationcart", "tagline": "K230 分类 + 麦轮按湿度自主行走灌溉，工程化最高",
     "stack": "ESP32-S3 · K230 · 麦克纳姆轮 · PS2", "scale": "1968 文件 · 396MB · 源码217"},
    {"id": "fermenter", "tagline": "温湿度 + 有害气体联动投料翻堆，好氧发酵不臭周期短",
     "stack": "Arduino Nano · DHT11 · KQM2800 · 舵机", "scale": "126 文件 · 369MB · CAD29"},
    {"id": "soilloosen", "tagline": "HX711 测松土阻力 + 麦轮自走 + 网页控制，深度变可测参数",
     "stack": "ESP32 · 麦克纳姆 · HX711 · WiFi AP", "scale": "47 文件 · 1.7MB"},
    {"id": "herbgrowtower", "tagline": "600×300 三层香草种植塔结构件，4 件型材 CAD",
     "stack": "SolidWorks · 铝型材 · 600×300 三层", "scale": "4 文件 · 0.3MB"},
    {"id": "aquaponics", "tagline": "鱼菜共生装配体结构件建模，11 件 STL/SLDPRT",
     "stack": "SolidWorks · STL · SLDPRT", "scale": "11 文件 · 0.3MB"},
    {"id": "farmtoolshare", "tagline": "柜体 ESP32 + 小程序 + TS 后端，农机具借还订单闭环",
     "stack": "ESP32 · 微信小程序 · Node/TS · 数据库", "scale": "199 文件 · 214MB"},
    # ---- 1.4 环境监测（12） ----
    {"id": "tileknock", "tagline": "负压吸附爬墙 + 双 SG90 敲击 + 双声音传感判空鼓",
     "stack": "ESP32 · SG90 敲击 · 声音传感 · 负压吸附", "scale": "96 文件 · 444MB · CAD14"},
    {"id": "tenghu", "tagline": "磁吸履带贴曲面行走，自适应铲剥离 + 清屑 + 喷防护漆闭环",
     "stack": "ESP32-S3 · 磁吸履带 · 电动推杆 · 水泵 · CAD258", "scale": "345 文件 · 1.86GB · CAD258"},
    {"id": "trashbin", "tagline": "气体采样 + HuskyLens 视觉双判干湿，双仓密封 + 太阳能",
     "stack": "Arduino Nano · HuskyLens · KQM2 · 太阳能", "scale": "161 文件 · 126MB · CAD67"},
    {"id": "dustcar", "tagline": "扩散预测调度 + 4 车接力 + 自主补水，沙盘演示降尘闭环",
     "stack": "ESP32-WROOM · PS2 · 麦轮底盘 · MKS 步进", "scale": "101 文件 · 7.7MB · 源码61"},
    {"id": "puddlecar", "tagline": "YOLO + K210 识别积水，抽吸清理 + 雨水回用",
     "stack": "YOLO · K210 · 6 轴机械臂", "scale": "2588 文件 · 105MB · CAD74"},
    {"id": "amphibclean", "tagline": "水里当船、空中当机：空中巡查定位 + 水面收集垃圾",
     "stack": "Arduino · SBUS · Servo PWM · 3D 打印", "scale": "168 文件 · 257MB · CAD27"},
    {"id": "waterlitter", "tagline": "PS2 遥控双电机正反转收垃圾，附 2 课时教学包",
     "stack": "Arduino Nano · PS2 · L298N · 2 课时教学包", "scale": "11 文件 · 0.6MB"},
    {"id": "petfeeder", "tagline": "K230 识别猫狗身份按个体分粮，PC 建库 + Web 界面",
     "stack": "K230 · ESP32-S3 · PC 服务 · Web 界面", "scale": "106 文件 · 4.3MB · 源码35"},
    {"id": "treegenerator", "tagline": "树竹风摆转冲程直线发电，给林区监测设备供电",
     "stack": "磁铁阵列 · 铜线圈 · 1:4 齿轮 · 整流桥", "scale": "114 文件 · 516MB · CAD71"},
    {"id": "evsolar", "tagline": "电动车加装太阳能充电结构，19 件 CAD（无电气）",
     "stack": "SolidWorks · 19 件 CAD · 结构建模", "scale": "19 文件 · 1.6MB · CAD19"},
    {"id": "solarpanelclean", "tagline": "42 步进 + 丝杠滑台定时往返清洗光伏板，400 脉冲/圈",
     "stack": "42 步进 · L298N 半步 · 丝杠滑台 · 限位", "scale": "11 文件 · 1.1MB"},
    {"id": "cigarettopicker", "tagline": "视觉识别烟头 + 云台对准 + 机械抓取回收",
     "stack": "Arduino · HuskyLens · PS2X · 双舵机云台", "scale": "91 文件 · 120MB"},
    # ---- 1.5 教育（7） ----
    {"id": "cleantray", "tagline": "HX711 称重判光盘，达标舵机倒残汤、推盘回收，语音提醒重称",
     "stack": "HX711 · OLED · 语音模块 · 4 舵机", "scale": "177 文件 · 1.06GB · CAD35"},
    {"id": "blackboarderaser", "tagline": "真空吸附 + 视觉识别自动擦黑板，小学五年级科学",
     "stack": "真空泵 · 摄像头 · ESP32 · Python", "scale": "214 文件 · 91MB"},
    {"id": "aipiggybank", "tagline": "图像识别纸币面额记账 + 语音理财陪伴，存钱变复利游戏",
     "stack": "微信小程序 · MQTT · TCS34725 · py-xiaozhi", "scale": "660 文件 · 694MB · 源码83"},
    {"id": "musicscroll", "tagline": "麦克风听演奏做乐谱跟随，按拍位自动翻页 + RGB 提示",
     "stack": "ESP32 · 舵机 · Python 乐谱跟随 · 双固件", "scale": "123 文件 · 36MB · CAD26 · 源码44"},
    {"id": "bikewheels", "tagline": "MPU6050 姿态解算 + 互补滤波，按倾角伸缩辅助轮",
     "stack": "Arduino Nano · MPU6050 · 双舵机", "scale": "3 文件 · 0.5MB"},
    {"id": "emlauncher", "tagline": "电磁弹射原理教具方案，单文档未落模型与代码",
     "stack": "文档级 · 电磁弹射原理 · 教具方案", "scale": "13KB"},
    {"id": "boardadsorb", "tagline": "黑板吸附擦除结构设想，单文档创意级",
     "stack": "文档级 · 黑板吸附擦除 · 创意", "scale": "12KB"},
    # ---- 1.6 交通（5） ----
    {"id": "smartcrosswalk", "tagline": "暗光发光边界 + 红外闯线识别 + 阻挡杆灯带 + 语音提示",
     "stack": "ESP32-S3 · 人体红外 · 语音 · 舵机阻挡杆 · 12V 锂电", "scale": "65 文件 · 648MB"},
    {"id": "bikecopter", "tagline": "同车体在骑行态与四旋翼态变形，堵车积水路段可飞",
     "stack": "飞控 · 折叠舵机 · 齿轮传动 · 174 件 CAD", "scale": "252 文件 · 610MB · CAD174"},
    {"id": "potholecar", "tagline": "摄像头找坑洞 → 丝杠定位 → 钻头清理 → 蠕动泵灌水泥",
     "stack": "摄像头 · 丝杠滑轨 · 蠕动泵 · PS2 · ESP32", "scale": "210 文件 · 838MB · CAD112"},
    {"id": "zishuiting", "tagline": "凹槽顶棚滞水缓流 + 水泵循环蒸发降温，1℃ 回差防抖",
     "stack": "ESP32-S3 · DHT11 · 水泵 · 网络校时 · 铝型材", "scale": "160 文件 · 630MB · CAD23"},
    {"id": "doorcrash", "tagline": "后向行车骑行双提示，下车前阻断式预警，全库模板母本",
     "stack": "盲区监测 · 后向雷达 · 视觉提示", "scale": "305 文件 · 92MB · CAD21"},
    # ---- 1.7 机器人（9） ----
    {"id": "armexo", "tagline": "开源六轴人形臂做腰部穿戴，ROS2 IK + 零位标定 + 遥操作",
     "stack": "ROS2 · 舵机总线 · 行星减速 51:1 · STM32F4", "scale": "5399 文件 · 1.37GB · 源码2570 · CAD463"},
    {"id": "rovs", "tagline": "5~6 推进器 + PCA9685 舵机，PS2 死区与超时保护",
     "stack": "Arduino · PS2X · PCA9685 · 推进器电调", "scale": "121 文件 · 38MB · CAD115"},
    {"id": "armxlamp", "tagline": "桌面六轴臂 + 小智语音灯效，STM32F4 + CAN 教具",
     "stack": "STM32F4 · CAN · Emm_V5 · FreeRTOS · MQTT", "scale": "903 文件 · 158MB · 源码149 · CAD84"},
    {"id": "armtable", "tagline": "机械臂嵌入创客桌，丝杠升降 + 桌面集成，教具做成家具",
     "stack": "STM32F4 · CAN · 丝杠升降 · 铝型材", "scale": "957 文件 · 215MB · CAD108"},
    {"id": "satelliterepair", "tagline": "履带底盘 + 工具箱 + 机械臂，模拟在轨卫星维修抓取",
     "stack": "Arduino · SolidWorks · 履带底盘 · 机械臂", "scale": "554 文件 · 397MB · CAD33"},
    {"id": "hexapodpatrol", "tagline": "六足越障校园巡逻安防，7 件套申报包",
     "stack": "六足 · 越障 · 7 件套申报包", "scale": ""},
    {"id": "hexapodvideo", "tagline": "六足巡逻的含视频交付版，5 条目 zip",
     "stack": "六足 · 视频交付版 · 5 条目 zip", "scale": ""},
    {"id": "makertable", "tagline": "20/30 系列铝型材创客桌结构，3 件 CAD",
     "stack": "SolidWorks · 铝型材 · 3 件 CAD", "scale": "3 文件 · 0.9MB"},
    {"id": "exomyrover", "tagline": "ESA 六轮摇臂月球车国产化资料包，设计 + BoM + 电气图纸",
     "stack": "3D 打印 · 摇臂转向架 · 树莓派 · BoM", "scale": "993 文件 · 800MB"},
    # ---- 1.8 文化创意（4） ----
    {"id": "goboardlock", "tagline": "8×8 棋盘落子当密码，行列扫描 + 多帧投票防误判",
     "stack": "ESP32-S3 · 行列扫描 · 磁性棋子 · 丝杠滑台锁", "scale": "64 文件 · 175MB · CAD45"},
    {"id": "shortfilm_mask", "tagline": "AI 生成 2 分钟抗深度伪造短片，分镜与提示词全留档",
     "stack": "生成式视频 · AI 绘图 · 剧本工程", "scale": "5.65MB"},
    {"id": "shortfilm_fraud", "tagline": "AI 风控反诈主题科普短片，创意阐述与制作过程留档",
     "stack": "AI 视频 · 剧本工程 · 反诈主题", "scale": ""},
    {"id": "signageplate", "tagline": "培新教育四字阳刻 + 装配切片打印，STL 单件 258MB",
     "stack": "SolidWorks · 阳刻 · 3MF 切片", "scale": "14 文件 · 约 280MB"},
    # ---- 1.9 生活/消费（5） ----
    {"id": "spicebox", "tagline": "五路出料：盐/味精/鸡精舵机、酱油醋水泵，按住才出",
     "stack": "Arduino Uno · 舵机 · 水泵 · 天问语音", "scale": "29 文件 · 3.4MB · CAD22"},
    {"id": "tablemat", "tagline": "K230/K210 分区识别餐盘落位，6 路继电器只热有盘区",
     "stack": "K230/K210 · 6 路继电器 · 加热膜", "scale": "30 文件 · 3.7MB"},
    {"id": "fridgefruit", "tagline": "深度学习识别冰箱变质水果并联动处理，含查新报告",
     "stack": "深度学习 · 29 件 CAD · 查新报告", "scale": "90 条目"},
    {"id": "drinkmixer", "tagline": "人脸/语音识别偏好自动配比出饮品，双版本交付",
     "stack": "人脸识别 · 语音识别 · 双版本交付", "scale": ""},
    {"id": "deliverylocker", "tagline": "冷热分区恒温 + 存取控制，双版本交付",
     "stack": "冷热分区恒温 · 存取控制 · 双版本", "scale": ""},
    # ---- 1.10 结构件/Demo（5） ----
    {"id": "hangerframe", "tagline": "铝型材晾衣架结构件，后演化为智能烘干衣架",
     "stack": "SolidWorks · 铝型材 PA20 · 3 件 CAD", "scale": "3 文件 · 0.5MB"},
    {"id": "herbalrelief", "tagline": "编号零件 15/25/35 装配体，无说明文档",
     "stack": "SolidWorks · 编号零件装配 · 4 件", "scale": "4 文件 · 0.5MB"},
    {"id": "boringbox", "tagline": "单零件结构 Demo，含 SLDPRT/STEP/STL 三格式",
     "stack": "SolidWorks · SLDPRT · STEP/STL", "scale": "3 文件 · 0.2MB"},
    {"id": "wallclimber", "tagline": "单零件爬墙机构设想，2 件 SolidWorks 模型",
     "stack": "SolidWorks · 2 件 · 爬墙机构", "scale": "2 文件 · 0.1MB"},
    {"id": "steprgb", "tagline": "踩踏触发 RGB + K10 摇杆电机控制，2 段 ino Demo",
     "stack": "K10(Unihiker) · 步进 · RGB 灯", "scale": "3 文件 · 0.2MB"},
]

SEC_RE = re.compile(r"^###\s+1\.(\d+)\s+(.+?)（(\d+)\s*项")
YEAR_RE = re.compile(r"(?:19|20)\d{2}")
STATUS_CHARS = "●◐○△"
ID_RE = re.compile(r"^[a-z][a-z0-9_]*$")
NUM_RE = re.compile(r"\d+(?:\.\d+)?k?")


def fail(msg: str) -> None:
    print(f"[FAIL] {msg}", file=sys.stderr)
    sys.exit(1)


def parse_source():
    text = SRC.read_text(encoding="utf-8")
    sections = []  # [{idx, track, declared, rows: [...] , skipped: int}]
    cur = None
    for line in text.splitlines():
        s = line.strip()
        m = SEC_RE.match(s)
        if m:
            idx = int(m.group(1))
            cur = {"idx": idx, "track": TRACK[idx], "declared": int(m.group(3)), "rows": [], "skipped": 0}
            sections.append(cur)
            continue
        if s.startswith("## ") or s == "---":
            cur = None
            continue
        if cur is None or not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if len(cells) != 8:
            fail(f"1.{cur['idx']} 表格列数异常({len(cells)}): {s[:80]}")
        if cells[0] == "项目" or all(re.fullmatch(r":?-+:?", c) for c in cells):
            continue
        if "非作品" in cells[0]:
            cur["skipped"] += 1
            continue
        if cells[1] != cur["track"]:
            fail(f"领域列与赛道不一致: {cur['track']} vs {cells[1]} | {cells[0]}")
        status = next((ch for ch in cells[5] if ch in STATUS_CHARS), None)
        if status is None:
            fail(f"完成度无法识别: {cells[5]} | {cells[0]}")
        cur["rows"].append({
            "title": cells[0],
            "innovation": cells[2],
            "tech": cells[3],
            "delivery": cells[4],
            "status": status,
            "evidence": cells[6],
            "time": cells[7],
        })
    return sections


def check_curated():
    if len(CURATED) != TOTAL:
        fail(f"CURATED 条数 {len(CURATED)} != {TOTAL}")
    ids = [c["id"] for c in CURATED]
    if len(set(ids)) != len(ids):
        dup = sorted({i for i in ids if ids.count(i) > 1})
        fail(f"id 重复: {dup}")
    for c in CURATED:
        if not ID_RE.match(c["id"]):
            fail(f"id 不合规: {c['id']}")
        if len(c["tagline"]) > TAGLINE_MAX:
            fail(f"tagline 超 {TAGLINE_MAX} 字({len(c['tagline'])}): {c['id']} → {c['tagline']}")
        parts = [p.strip() for p in c["stack"].split("·") if p.strip()]
        if not (STACK_MIN <= len(parts) <= STACK_MAX):
            fail(f"stack 关键词数 {len(parts)} 不在 {STACK_MIN}–{STACK_MAX}: {c['id']} → {c['stack']}")


def main():
    check_curated()
    sections = parse_source()

    if [s["idx"] for s in sections] != list(range(1, 11)):
        fail(f"赛道小节数异常: {[s['idx'] for s in sections]}")
    for s in sections:
        if len(s["rows"]) != EXPECTED_COUNTS[s["idx"]]:
            fail(f"1.{s['idx']} 解析到 {len(s['rows'])} 行，期望 {EXPECTED_COUNTS[s['idx']]}")
        if len(s["rows"]) != s["declared"]:
            fail(f"1.{s['idx']} 解析行数 {len(s['rows'])} 与标题声明 {s['declared']} 不符")
    skipped = sum(s["skipped"] for s in sections)
    if skipped != 2:
        fail(f"非作品行应为 2，实际 {skipped}")

    rows = [(s, r) for s in sections for r in s["rows"]]
    if len(rows) != TOTAL:
        fail(f"解析行数 {len(rows)} != {TOTAL}")

    items = []
    for (sec, row), cur in zip(rows, CURATED):
        year = YEAR_RE.findall(row["time"])
        if not year:
            fail(f"时间列无年份: {row['title']} | {row['time']}")
        # 规模数字必须能在证据列中找到（防止手抄出错）
        compact = re.sub(r"\s+", "", row["evidence"]).lower()
        for tok in NUM_RE.findall(cur["scale"].lower()):
            if tok not in compact:
                fail(f"规模数字对不上原文: {cur['id']} token={tok} scale={cur['scale']!r} evidence={row['evidence']!r}")
        items.append({
            "id": cur["id"],
            "title": row["title"],
            "category": CATEGORY[sec["track"]],
            "track": sec["track"],
            "tagline": cur["tagline"],
            "stack": cur["stack"],
            "status": row["status"],
            "year": year[-1],
            "scale": cur["scale"],
        })

    # 校验：id 唯一 / 分类计数 / 完成度分布
    if len({it["id"] for it in items}) != TOTAL:
        fail("items 内 id 不唯一")
    counts = {}
    for it in items:
        counts[it["category"]] = counts.get(it["category"], 0) + 1
    if sum(counts.values()) != TOTAL:
        fail(f"分类计数之和 {sum(counts.values())} != {TOTAL}")
    status_counter = {ch: 0 for ch in STATUS_CHARS}
    for it in items:
        status_counter[it["status"]] += 1
    if status_counter != EXPECTED_STATUS:
        fail(f"完成度分布 {status_counter} != 底稿口径 {EXPECTED_STATUS}")

    # categories：name 用展示名（= items.category），按数量降序，同数量按赛道在底稿中的先后
    order = {name: i for i, name in enumerate(TRACK.values())}
    cat2track = {v: k for k, v in CATEGORY.items()}
    categories = [
        {"name": cat, "track": cat2track[cat], "count": counts[cat]}
        for cat in sorted(counts, key=lambda c: (-counts[c], order[cat2track[c]]))
    ]
    if set(counts) != set(cat2track):
        fail("categories 与 items.category 不一致")

    catalog = {"total": TOTAL, "categories": categories, "items": items}
    OUT_JSON.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # catalog.md（人可读校对版）
    md = []
    md.append(f"# 项目全景目录（{TOTAL} 项）\n")
    md.append("> 数据源：`D:\\a本人项目文件\\_职业诊断底稿\\01_产品档案.md` 第 1 节全景总表（1.1–1.10，共 71 项装置，剔除非作品 2 项）。")
    md.append("> 生成脚本：`tools/build_catalog.py`；结构化数据见 `content/catalog.json`。\n")
    md.append("**完成度图例**：" + " · ".join(f"{k} {v}" for k, v in STATUS_LEGEND.items()) + "\n")
    md.append("## 分类统计\n")
    md.append("| 展示名 | 赛道 | 数量 |")
    md.append("|---|---|---|")
    for c in categories:
        md.append(f"| {c['name']} | {c['track']} | {c['count']} |")
    md.append(f"| **合计** | — | **{TOTAL}** |\n")
    md.append("## 项目清单（按赛道）\n")
    n = 0
    for sec in sections:
        md.append(f"### {sec['idx']}. {CATEGORY[sec['track']]}（{len(sec['rows'])} 项）\n")
        md.append("| # | id | 项目 | 一句话亮点 | 技术栈 | 完成度 | 年份 | 规模 |")
        md.append("|---|---|---|---|---|---|---|---|")
        for row in sec["rows"]:
            n += 1
            it = items[n - 1]
            md.append(
                f"| {n} | `{it['id']}` | {it['title']} | {it['tagline']} | {it['stack']} "
                f"| {it['status']} | {it['year']} | {it['scale'] or '—'} |"
            )
        md.append("")
    OUT_MD.write_text("\n".join(md).rstrip() + "\n", encoding="utf-8")

    print(f"[OK] items={len(items)} total={TOTAL}")
    for c in categories:
        print(f"     {c['name']:<10} {c['count']:>2}  (track={c['track']})")
    print(f"     status: " + " · ".join(f"{k}{v}" for k, v in status_counter.items()))
    print(f"[OK] 写入 {OUT_JSON}")
    print(f"[OK] 写入 {OUT_MD}")


if __name__ == "__main__":
    main()
