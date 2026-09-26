---
title: 自动驾驶技术指南：从基础概念到工程实践
description: 中文自动驾驶技术指南，涵盖 SAE 分级、系统架构、车载传感器、感知定位、规划控制、端到端学习、仿真测试和视觉语言模型，并介绍 Apollo、Waymo、Tesla 等实践案例。
---

# 自动驾驶技术指南

--- A Practical Guide to Autonomous Driving

本指南由 云飞机器人实验室 ( [知乎](https://www.zhihu.com/column/yfworld) | [B站](https://space.bilibili.com/493264461) | [博客](https://yfrobotics.github.io/) | [YouTube](https://www.youtube.com/@yfrobotics) | [Ins](https://www.instagram.com/yfrobotics/) ) 发起，系统介绍自动驾驶技术的历史、现状与发展趋势，覆盖从基础概念到核心算法、从硬件系统到工程落地的完整知识体系。无论你是刚接触自动驾驶的学生，还是希望拓宽技术视野的工程师，都可以在这里找到适合的内容。

![Google 自动驾驶测试车](_static/img/google_av.png)

---

## 本指南包含什么？

| 章节 | 内容 | 适合读者 |
|------|------|----------|
| [第一章：概述](intro/index.md) | 自动驾驶的定义、SAE 分级体系、发展历史与术语表 | 所有读者 |
| [第二章：系统](system/index.md) | 车辆架构、V2X 车联网、高精地图、功能安全与法规 | 系统工程师、产品经理 |
| [第三章：硬件](hardware/index.md) | 计算平台、线控底盘、车载通信、传感器与摄像头 | 硬件工程师、嵌入式开发者 |
| [第四章：算法](algorithm/index.md) | 感知、融合、定位、规划、预测、控制、端到端学习 | 算法工程师、研究者 |
| [第五章：仿真测试](simulation/index.md) | 仿真平台、场景生成、闭环策略评测、Sim-to-Real | 测试工程师、仿真开发者 |
| [第六章：视觉语言与动作模型](vlm/index.md) | VLM、VLA 动作生成、训练与闭环验证、部署优化 | 算法研究者、AI 工程师 |
| [第七章：实例](casestudy/index.md) | Apollo、Waymo、Tesla、中国本土玩家、Robotaxi 商业模式 | 所有读者 |

---

## 推荐阅读路径

**入门读者**：从第一章概述开始，依次阅读各章的概述页面（点击左侧导航栏中的章节名即可进入该章概述），建立整体认知后再深入感兴趣的子话题。

**算法方向**：第一章概述 → 第四章算法（按感知 → 预测 → 规划 → 控制的顺序） → 第六章视觉语言大模型 → 第七章案例对比不同技术路线。

**系统/硬件方向**：第一章概述 → 第二章系统 → 第三章硬件 → 第五章仿真测试 → 第七章案例了解工程落地实践。

**前沿研究**：第四章算法 → 第六章视觉语言大模型 → 第五章仿真测试（Sim-to-Real 迁移）。

---

## 参与贡献

本指南是一个开源项目，欢迎所有人参与完善。你可以通过提交 Pull Request 或创建 Issue 来贡献内容。详见[如何贡献](how-to-contribute.md)和[书写规范](standard.md)。

---

## 赞助支持

如果本指南对你有帮助，欢迎通过支付宝或微信支付支持我们。你的支持会用于内容的持续更新与维护，非常感谢！

<p align="left">
  <img src="_static/img/payment-qr-codes.png" alt="支付宝 / 微信支付" width="520">
</p>

---

## 版权声明

![cc-by-sa-4.0](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)

本维基遵循"知识共享署名-相同方式共享4.0 国际协议 (CC 4.0-BY-SA)" ，详见[条款](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-Hans)。
