# 端到端自动驾驶

端到端（End-to-End）自动驾驶是一种将传感器输入直接映射到车辆控制输出的统一深度学习框架，与传统的模块化管线（感知→预测→规划→控制）形成鲜明对比。随着深度学习能力的飞跃和数据规模的膨胀，端到端方法正从实验室走向量产。


!!! info "本节包含"
    - [数据与训练体系](end_to_end_data_training.md) — 数据采集、场景挖掘、标注体系、扩展律实践、合成数据、训练策略与版本管理
    - [安全与部署体系](end_to_end_safety_deployment.md) — 可解释性、不确定性估计、安全层架构、OOD 检测、验证、上线与回滚
    - [世界模型](world_models.md) — 世界模型的完整讨论（本页的世界模型一节仅为摘要）
    - [VLM 决策与规划](../vlm/decision_planning.md) — 语言中间表征与规划方法
    - [VLA 专题](../vlm/vla.md) — 动作表示、训练流程与闭环验证

## 模块化管线 vs 端到端

| 维度 | 模块化管线（Traditional） | 端到端（End-to-End） |
| --- | --- | --- |
| 系统架构 | 感知→预测→规划→控制，各模块串行 | 统一神经网络，直接输出控制量 |
| 中间表示 | 明确（目标列表、轨迹、地图） | 隐式（神经网络内部特征） |
| 可解释性 | 强，每个模块可独立调试 | 弱，"黑盒"特性 |
| 错误传播 | 上游模块误差在下游级联放大 | 端到端联合优化，避免中间量误差 |
| 泛化能力 | 受限于人工规则和中间表示质量 | 数据驱动，可拟合复杂分布 |
| 训练方式 | 各模块独立训练，可用有标注数据 | 需要大规模真实驾驶数据或仿真 |
| 工程复杂度 | 模块间接口定义复杂，集成调试繁琐 | 架构简洁，但数据管理复杂 |

两种路线并非绝对对立。业界趋势是**"端到端骨干 + 可解释辅助监督头"**的混合方案：保留端到端的优化能力，同时通过辅助任务（如中间感知监督）提升可解释性和数据效率。


## 发展历程

### 第一阶段：行为克隆萌芽（2015–2019）

**NVIDIA DAVE-2（2016）——端到端驾驶先驱：**

直接从单摄像头图像预测转向角，是第一个在真实道路验证的端到端系统：

```
摄像头图像（3×66×200）
    │
5 个卷积层（特征提取）
    │
3 个全连接层
    │
转向角输出（单个标量）
```

以约 72 小时人类驾驶视频为训练数据，在高速公路测试有效。局限：仅输出转向角，没有纵向控制；遇到训练分布外场景容易失败。

**ChauffeurNet（Waymo/Google, 2019）：**

将感知结果渲染为俯视语义图像（Road Map + Agent Box），再进行端到端规划。规避了原始传感器的复杂性，加入了对抗训练使模型能处理长尾场景（如交通事故、逆行车辆）。

### 第二阶段：BEV 感知 + 模块化辅助（2020–2022）

BEV（Bird's Eye View，鸟瞰视角）感知范式兴起，成为端到端系统的标准中间表示：

**BEVFormer（Li et al., ECCV 2022）：**
- 跨摄像头、跨时间帧的 Transformer 注意力机制
- 利用空间可变形注意力将多视角图像特征投影到统一 BEV 网格

**BEVDet（Huang et al., 2021）：**
- 基于 LSS（Lift-Splat-Shoot）方法，通过深度估计将 2D 特征提升到 3D

**UniAD（Hu et al., CVPR 2023 最佳论文）：**

将感知（追踪、在线地图）、预测和规划统一在单一 Transformer 网络中，端到端优化：

```
多摄像头 → BEV 编码器 → [追踪头] → [在线地图头] → [运动预测头] → [规划头] → 轨迹
                                ↕ 跨任务注意力（Query 交互）
```

UniAD 证明了联合优化有助于规划性能，开创了"以规划为导向的感知"研究范式。

### 第三阶段：大规模端到端量产（2023–至今）

**Tesla FSD V12（2023）——首个量产端到端：**

Tesla 宣布将传统 C++ 模块化代码（超过 300,000 行）替换为统一的端到端神经网络，处理从 8 路摄像头到车辆控制的全流程：
- 输入：8 路摄像头原始图像帧序列
- 输出：方向盘转角、油门、制动控制量
- 规模：数千万参数，需要 HW4 FSD 芯片支持

**Tesla FSD V13 → V14（2024–2026）：**

V14 的重点从"能不能端到端"转向"端到端如何工程化"：

- **统一模型**：Summon（智能召唤）、FSD 与 Robotaxi 收敛到同一个模型，为 Robotaxi 规模化铺路
- **编译器重写**：AI 编译器与运行时改用 **MLIR**，反应时延降低约 20%——这是纯软件侧的收益，说明端到端方案的瓶颈已从模型精度转向推理栈效率
- **蒸馏下放**：V14 Lite 把 HW4 上 V14 的能力蒸馏到算力更低的 HW3，以 HW4 V14 作为教师模型，使老平台也获得 RL 与离线模型带来的改进

**DriveVLM（Tian et al., 清华/理想，2024）：**
将视觉语言模型（VLM）引入端到端驾驶，实现场景理解和自然语言可解释性：
- VLM 负责场景分析和高层决策生成（用文字描述驾驶意图）
- 轨迹生成网络负责将文字决策转化为具体轨迹

### 第四阶段：基础模型与 VLA（2025–2026）

**Waymo Foundation Model——L4 运营商的端到端转向：**

2025 年 12 月 Waymo 发表《Demonstrably Safe AI》，随后公开了其商业车队实际运行的技术：车辆由一个 **端到端训练的基础模型（Foundation Model）** 控制，模块之间以可学习的中间表征而非人工接口连接，路线与 Tesla、Wayve 趋同。值得注意的是它与研究原型 EMMA 的关系：

- **EMMA**（2024，基于 Gemini）在论文层面表现亮眼（链式思维推理使端到端规划性能提升 6.7%），但 Waymo 团队明确指出它"面临真实部署的挑战"——**空间推理能力不足、计算成本过高**
- Waymo 因此没有直接部署 EMMA，而是延续该思路持续打磨，最终以 Foundation Model 进入量产车队
- 该模型在美国公开道路 **超过 3 亿自动驾驶公里** 上完成开发与验证，并以"端到端 + 持续安全验证"的组合替代纯端到端——Waymo 强调模型必须嵌入可论证的安全框架（Safety Case）之内，而非以模型能力本身作为安全论据（详见 [Waymo 案例](../casestudy/waymo.md)）

!!! quote "一个值得记住的工程判断"
    EMMA 的命运说明：**benchmark 上的提升与可部署性是两件事**。一个把规划指标提升 6.7% 的模型，可能因为空间推理不稳和算力开销而完全无法上车。评估端到端方案时，闭环时延、最坏情况算力与失效行为，与平均精度同等重要。

**E2E 与 VLA 的收敛：**

2026 年量产方案已普遍从"端到端"演进为 **VLA（Vision-Language-Action）**：在端到端的基础上引入语言/推理中间层以获得可解释性与常识推理，随后又为了时延把显式语言层重新去掉（如小鹏 VLA 2.0 的"视觉 → 隐式 token → 动作"，决策时延从 200 ms 压至 **< 80 ms**）。完整对比见 [VLM 展望与挑战](../vlm/outlook.md)。


## 关键技术

### 占用网络（Occupancy Network）

传统目标检测输出稀疏的 3D 边界框，受限于预定义类别（无法检测"奇怪的障碍物"）。**占用网络**将三维空间离散化为体素网格，预测每个体素的占据状态和语义：

$$O_{xyz} \in \{0, 1\} \times \text{Class}\ =\ f_\theta(I_1, I_2, \ldots, I_N)$$

**优点：**
- 表达任意形状的障碍物（不受边界框形状限制）
- 适合开放世界感知（处理从未见过的物体类型）

**代表工作：** Tesla Occupancy（2022 AI Day）、Occ3D（清华，2023）、SurroundOcc（旷视，2023）。

### 知识蒸馏与特权学习

端到端视觉模型的挑战之一：纯摄像头无法直接获取精确深度，而 LiDAR 可以。**特权学习**（Privileged Learning）让学生网络（仅摄像头）向教师网络（含 LiDAR）学习：

$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{task}}(\hat{y}, y) + \lambda \, \mathcal{L}_{\text{KD}}(f_{\text{student}},\ f_{\text{teacher}})$$

其中 $\mathcal{L}_{\text{KD}}$ 为特征级或输出级蒸馏损失。推理时仅用摄像头，无需 LiDAR，但获得了接近 LiDAR 水平的感知能力。


## 世界模型（World Model）

!!! info "完整内容见专章"
    NeRF/3DGS 重建、潜在世界模型、视频生成仿真，以及 GAIA-3、Waymo World Model、Cosmos 3 等 2025–2026 年进展，见 [世界模型](world_models.md)。本节只说明世界模型 **在端到端体系中承担什么角色**。

### 定义与核心思想

世界模型是一种通过**自监督学习**构建的环境内部表征，能够在隐空间预测未来状态，从而在不执行实际动作的情况下支持"想象式"规划。其核心思路受认知科学启发：人类驾驶员在行动前会在脑中模拟可能的场景。

形式上由状态转移模型与解码器两部分组成：

$$z_t \sim p_\theta(z_t \mid z_{t-1},\ a_{t-1}), \qquad \hat{x}_t \sim q_\theta(\hat{x}_t \mid z_t)$$

其中 $z_t$ 为隐状态，$a_{t-1}$ 为上一步动作，$\hat{x}_t$ 为预测观测。

### 在端到端体系中的两个作用

**一是数据增强**——把已有真实数据"变形"为新场景（改天气、改交通密度、插入参与者），低成本扩充长尾数据：

$$x_{\text{aug}} = G_\theta(z_{\text{real}},\ c_{\text{new}}), \quad c_{\text{new}} \in \{\text{rain}, \text{night}, \text{fog}, \ldots\}$$

**二是基于模型的规划**——在隐空间中搜索最优行动序列，避免真实世界试错：

$$a_{0:H}^* = \arg\max_{a_{0:H}} \sum_{t=0}^{H} \gamma^t r(z_t, a_t), \quad z_{t+1} \sim p_\theta(z_{t+1} \mid z_t, a_t)$$

其中 $r$ 为奖励函数（行驶进度、舒适性、无碰撞），$H$ 为规划时域。

!!! warning "2026 年的实际分工"
    需要强调的是：**没有任何量产方案把生成式世界模型放在车端做在线推理**。世界模型留在云端做训练数据生成与回归评测，车端只跑蒸馏后的策略模型。把世界模型理解为"车上的想象力"是一种误解，它目前的主要价值在离线侧。

## 具身智能与驾驶

!!! info "完整内容见 VLM 章节"
    双系统架构（DriveVLM）、链式推理（CoT）驾驶决策、语言作为中间表征、LLM 直接生成轨迹与 LLM 调参控制器，均在 [VLM 决策与规划](../vlm/decision_planning.md) 中有更完整的展开；各系统的横向对比与量产进展见 [展望与挑战](../vlm/outlook.md)。本节只保留与端到端工程直接相关的一个问题：**接地（Grounding）**。

### 具身智能的接地问题

把语言模型接入真实驾驶世界，面临的不是精度问题而是根本性的错配：

1. **空间接地**：语言模型天然缺乏精确空间感知——"前方 15 m"对 LLM 而言是模糊概念，而控制器需要的是米级数值
2. **时序接地**：驾驶场景以 10 Hz 变化，而 LLM 自回归推理延迟以百毫秒到秒计
3. **分布漂移**：LLM 在网络文本上预训练，驾驶场景描述与其预训练分布差异极大
4. **幻觉问题**：LLM 可能"虚构"不存在的障碍物或交通规则——在安全攸关回路中不可接受

解决方向：多模态对齐训练（视觉 token 与语言 token 联合训练）、视觉感知与语言推理之间的专门接口设计、以真实驾驶数据做指令微调。

!!! success "2026 年的答案：把语言层去掉"
    上述四个问题中，时序接地最难绕过。量产方案给出的答案相当直接——**不再让语言出现在实时回路里**：小鹏 VLA 2.0 采用"视觉 → 隐式 token → 动作"，去掉显式语言转译层后决策时延从 200 ms 降至 **< 80 ms**。语言退回到训练阶段（作为监督信号与推理链标注）与离线可解释性分析，而不再是运行时的中间表示。这也说明"语言中间表达"更适合作为 **训练与审计工具**，而非实时架构。

## 数据扩展律（Scaling Laws）

### 自动驾驶中的数据扩展现象

Scaling Laws 最初由 OpenAI 在语言模型研究中发现：模型性能随参数量 $N$、数据量 $D$、算力 $C$ 呈幂律增长：

$$L(N, D) \propto N^{-\alpha} + D^{-\beta} + L_\infty$$

自动驾驶领域同样观察到类似现象：随着训练数据规模增加，端到端模型在各类场景上的干预率（Human Intervention Rate）持续下降，且未见明显饱和趋势。

### 特斯拉 FSD V12 的数据规模

Tesla 是目前端到端自动驾驶数据规模最大的公司：

- **车队规模**：全球超过 600 万辆具备数据采集能力的车辆
- **年采集里程**：数十亿英里
- **视频帧数**：训练 FSD V12 使用数百亿图像帧（估计）
- **标注方式**：自动标注为主，人工复核为辅
- **算力投入**：约 10,000 块 H100 GPU 组成的 Dojo 超算集群

Tesla Elon Musk 公开表示，FSD V12 相比 V11 的核心改进来自于将训练数据从 10 亿帧扩展到 100 亿帧以上（10 倍数据量提升），而非模型架构创新。

### 视频预训练 → 驾驶微调范式

借鉴 LLM 的"预训练 + 微调"范式，驾驶世界模型采用两阶段训练：

**第一阶段：大规模视频预训练**

在互联网视频（YouTube 行车记录仪、街景视频）上进行自监督预训练，学习物理世界的通用视觉动态：

$$\mathcal{L}_{\text{pretrain}} = -\sum_t \log p_\theta(\hat{x}_t \mid x_{<t})$$

视频 token 预测（类似语言模型的下一个 token 预测）。

**第二阶段：驾驶场景微调**

在真实或合成驾驶数据上进行有监督微调，引入驾驶特定的动作条件和奖励信号：

$$\mathcal{L}_{\text{finetune}} = \mathcal{L}_{\text{pred}} + \lambda_1 \mathcal{L}_{\text{action}} + \lambda_2 \mathcal{L}_{\text{safety}}$$

这一范式的优势：视频预训练赋予模型对光照、天气、物理运动的强先验，大幅降低驾驶阶段的数据需求。

### 合成数据与真实数据配比

合成数据（来自仿真引擎或生成模型）成本低但存在领域偏差（Sim-to-Real Gap），真实数据昂贵但质量高：

| 数据来源 | 成本 | 数量上限 | 真实性 | 典型用途 |
| --- | --- | --- | --- | --- |
| 真实采集 | 高 | 受车队规模限制 | 高 | 核心训练集 |
| CARLA 仿真 | 低 | 无上限 | 中（视觉差距大）| 规则学习、结构性场景 |
| 神经渲染（NeRF）| 中 | 有限（基于真实场景重建）| 很高 | 数据增强、视角扩展 |
| 生成模型（扩散）| 低-中 | 较大 | 中-高 | 长尾场景补充 |

业界普遍经验：合成数据与真实数据的最优比例约为 **3:1 至 10:1**（合成数据更多），但过高比例的合成数据会导致性能下降（合成数据与真实数据在特征分布上存在差异）。


## 端到端安全性

### 黑盒不可解释性问题

端到端神经网络的核心安全挑战在于其**不可解释性（Black-Box Nature）**：

- 无法事先枚举所有失效场景
- 在训练分布外（Out-of-Distribution, OOD）的行为无法预测
- 调试困难：当系统做出错误决策时，难以定位原因

典型失效案例：对抗样本（Adversarial Example）——在路牌上贴一张人眼不可察觉的贴纸，可导致分类器完全失效，而基于规则的感知系统通常不会有此问题。

### 形式化验证的局限

形式化验证（Formal Verification）在传统软件中证明程序满足规约（Specification），但在深度神经网络上面临根本性困难：

- **参数空间维度过高**：数十亿参数的网络状态空间无法穷举
- **输入空间无界**：高维图像输入空间（224×224×3 = 150,528 维）的覆盖不可能完备
- **当前 SOTA**：仅能验证极小型网络（< 10,000 参数）在有限输入扰动下的局部鲁棒性

神经网络验证工具（ERAN、Marabou、α-β-CROWN）的实用限制：网络层数 < 20 层，输入扰动半径 $\epsilon < 0.01$（L∞ 范数），与量产网络差距数个数量级。

### 神经符号方法（Neural-Symbolic）

神经符号方法将神经网络的感知能力与符号逻辑的可验证性结合：

**架构分层：**

```
原始传感器输入
      │
[神经感知层] → 符号化中间表示（抽象场景图）
      │
[符号推理层] → 规则引擎 + 时序逻辑约束
      │
[控制输出层] → 经验证的动作指令
```

**优势：** 符号层可进行形式化推理（如"如果行人在斑马线内，必须减速"）

**劣势：** 神经感知到符号表示的转换（Perception-to-Symbol）本身是个神经网络，仍有不确定性；符号规则无法覆盖所有长尾场景

代表工作：DeepProbLog（结合概率逻辑与深度学习）、Neuro-Symbolic Concept Learner（NS-CL）。

### Safety Layer：RSS 与 CBF 安全过滤器

最实用的安全方案是在端到端输出上叠加独立的安全过滤层，对不安全的控制指令进行修正或拒绝：

**责任敏感安全（Responsibility-Sensitive Safety, RSS）：**

由 Intel Mobileye 提出，定义了一套形式化的安全驾驶规则集（如最小安全距离、响应时间约束），构成可证明安全的驾驶包络：

$$d_{\text{min,rear}} = v_r t_{\text{resp}} + \frac{v_r^2}{2a_{\text{max,brake}}} - \frac{v_f^2}{2a_{\text{min,brake}}}$$

若端到端输出的控制指令会违反 RSS 约束，则用 RSS 计算的安全指令替代。

**控制障碍函数（Control Barrier Function, CBF）：**

CBF 是一种基于李雅普诺夫方法的实时安全约束，将安全集 $\mathcal{C}$ 定义为状态空间中的不变集：

$$h(x) \geq 0 \Rightarrow x \in \mathcal{C} \quad \text{（安全区域）}$$

$$\dot{h}(x, u) \geq -\gamma h(x) \quad \text{（CBF 条件，确保系统不会离开安全集）}$$

实时 QP 过滤器：在满足 CBF 条件的前提下，寻找最接近端到端输出的安全控制指令：

$$u_{\text{safe}} = \arg\min_u \|u - u_{\text{e2e}}\|^2 \quad \text{s.t.} \quad \dot{h}(x, u) \geq -\gamma h(x)$$

CBF QP 的求解时间 < 1 ms，可在 1 kHz 控制频率下运行，不影响系统实时性。


## 典型开源系统

### UniAD（上海人工智能实验室，2023）

UniAD（Unified Autonomous Driving）是 CVPR 2023 最佳论文，首次将感知、预测、规划统一在单一 Transformer 网络中端到端优化：

**系统架构：**

```
多摄像头输入
    │
BEV 编码器（BEVFormer）
    │
┌───┴───┐
追踪头   地图头
（TrackFormer）（MapFormer）
     │
  运动预测头（MotionFormer）
     │
  占用预测头（OccupancyFlow）
     │
  规划头（PlannerMLP）
     │
  规划轨迹输出
```

所有模块通过**跨任务 Transformer 注意力**共享特征，上游任务（追踪、地图）为规划头提供丰富语义上下文。

**nuScenes 开放数据集性能：**

| 指标 | UniAD | 传统模块化基线 | 提升 |
| --- | --- | --- | --- |
| 规划碰撞率（L2=2s）| 0.48% | 0.87% | -45% |
| 规划 L2 偏差（3s）| 0.88 m | 1.45 m | -39% |
| 追踪 AMOTA | 0.359 | 0.293 | +22% |

### VAD（向量化场景表示端到端，2023）

VAD（Vectorized scene representation for efficient Autonomous Driving）以向量化表示替代栅格 BEV 特征，大幅降低计算量：

**核心创新：**
- 用向量（折线、多边形）而非密集栅格表示车道线、代理轨迹
- 向量交叉注意力替代空间卷积，参数更少，速度更快
- 引入场景约束损失：规划轨迹须满足地图拓扑约束（不逆行、不压实线）

**性能对比（nuScenes val）：**

| 指标 | VAD-Base | UniAD | VAD-Tiny（轻量版）|
| --- | --- | --- | --- |
| 碰撞率（1s）| 0.17% | 0.20% | 0.21% |
| L2（3s）| 0.72 m | 0.88 m | 0.83 m |
| 推理速度 | 16.8 FPS | 1.8 FPS | 33.5 FPS |

VAD-Tiny 以接近 UniAD 的性能实现约 18 倍的速度提升，更适合量产部署。

### SparseDrive（稀疏表示端到端，2024）

SparseDrive 将稀疏 3D 表示引入端到端框架，进一步降低计算复杂度：

**核心思想：** 仅在有意义的 3D 位置（目标、车道节点）维护稀疏特征，而非对整个 BEV 空间进行密集计算：

$$\mathbf{F}_{\text{sparse}} = \{(p_i, f_i)\}_{i=1}^{M}, \quad M \ll H \times W$$

其中 $p_i \in \mathbb{R}^3$ 为空间位置，$f_i \in \mathbb{R}^C$ 为对应特征，$M$ 为稀疏 token 数（约 200–500 个），远小于密集 BEV 特征图的 token 数（通常 2500–10000 个）。

**性能表现（nuScenes val）：**

| 指标 | SparseDrive-S | SparseDrive-B | VAD-Base |
| --- | --- | --- | --- |
| L2（1s/2s/3s）| 0.32/0.56/0.78 m | 0.31/0.54/0.74 m | 0.54/0.72/0.94 m |
| 碰撞率（3s）| 0.05% | 0.04% | 0.06% |
| 推理延迟 | 39 ms | 58 ms | 比较基准 |

### CARLA Leaderboard 性能对比

| 系统 | 公开时间 | Driving Score | Route Completion | Infraction Rate |
| --- | --- | --- | --- | --- |
| LAV（Learning from All Vehicles）| 2022 | 61.8 | 94.1% | 0.71 |
| TCP（Trajectory-guided Control Prediction）| 2022 | 75.9 | 95.6% | 0.80 |
| UniAD（CARLA 适配版）| 2023 | 78.4 | 96.8% | 0.82 |
| VAD | 2023 | 81.2 | 97.3% | 0.83 |
| DriveVLM-Dual | 2024 | 85.7 | 98.1% | 0.88 |

注：Driving Score = Route Completion × Infraction Score，满分为 100。数值来源于各论文报告，评测版本和传感器配置可能不完全一致。


## 数据飞轮

端到端自动驾驶的核心竞争力是**数据飞轮**（Data Flywheel）：

```
更多行驶里程
      │
      ▼
更多真实驾驶数据
      │
      ▼
更好的端到端模型
      │
      ▼
更安全 / 更智能的驾驶
      │
      ▼
更多用户接受 → 更多订阅收入 → 更多部署车辆
      │
      └──────────────────────────────────────┘
                    （循环飞轮）
```

**关键数据技术：**

| 技术 | 描述 | 目的 |
| --- | --- | --- |
| 影子模式（Shadow Mode） | 实车运行时记录自动驾驶"如果接管会怎么做" | 低风险大规模评估与数据收集 |
| 自动标注（Auto-Labeling） | 离线用多帧 LiDAR 重建 3D 点云，为视觉数据提供伪标注 | 降低人工标注成本 |
| 场景挖掘（Scene Mining） | 从海量数据中自动检索困难场景（变道干扰、鬼探头）进行重点训练 | 覆盖长尾分布 |
| 对抗数据生成 | 用仿真或 GAN 生成罕见危险场景 | 提升边角场景覆盖 |


## 大模型与具身智能

最前沿的研究将**大语言模型（LLM）**和**视觉语言模型（VLM）**引入自动驾驶：

**GPT-Driver（Mao et al., 2023）：**
将运动规划问题建模为自然语言生成任务，用 GPT-3.5 直接输出结构化轨迹：
- 优点：天然可解释（"因为前方有行人，所以我减速至 20 km/h"）
- 挑战：推理延迟 > 1 s，远超实时控制要求

**DriveVLM（2024）：**
结合 VLM 的常识推理能力（理解"婚礼车队"、"施工人员"等语义）和高效轨迹生成网络：
- 双系统设计：慢速 VLM（决策层）+ 快速轨迹网络（执行层）
- 覆盖"什么是前方物体、应如何响应"的语义推理

**趋势展望：**
- 感知、预测、规划、控制的边界将进一步模糊
- 世界模型将成为自动驾驶的"大脑"
- 多模态大模型将带来更强的零样本泛化和语言可解释性


## 参考资料

1. M. Bojarski et al. End to End Learning for Self-Driving Cars. NVIDIA, arXiv:1604.07316, 2016.
2. M. Hu et al. Planning-Oriented Autonomous Driving (UniAD). CVPR Best Paper, 2023.
3. A. Hu et al. GAIA-1: A Generative World Model for Autonomous Driving. arXiv:2309.17080, 2023.（世界模型系列的详细讨论见 [世界模型](world_models.md)）
4. Tesla. AI Day Technical Presentations, 2021–2023.
5. Y. Tian et al. DriveVLM: The Convergence of Autonomous Driving and Large Vision-Language Models. arXiv:2402.12289, 2024.
6. S. Wang et al. DriveLM: Driving with Graph Visual Question Answering. ECCV, 2024.
7. J. Jiang et al. VAD: Vectorized Scene Representation for Efficient Autonomous Driving. ICCV, 2023.
8. Z. Sun et al. SparseDrive: End-to-End Autonomous Driving via Sparse Scene Representation. arXiv:2405.19620, 2024.
9. D. Hafner et al. Mastering Diverse Domains through World Models (DreamerV3). arXiv:2301.04104, 2023.
10. W. Wang et al. DriveDreamer: Towards Real-world-driven World Models for Autonomous Driving. arXiv:2309.09777, 2023.
11. S. Shalev-Shwartz et al. On a Formal Model of Safe and Scalable Self-driving Cars (RSS). arXiv:1708.06374, 2017.
12. A. D. Ames et al. Control Barrier Functions: Theory and Applications. European Control Conference, 2019.
