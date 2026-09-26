# 基于 VLM 的决策与规划

动作 Token、轨迹解码、训练数据和执行接口的系统介绍见[视觉-语言-动作模型（VLA）](vla.md)；语言指令如何进入闭环测试，见[闭环仿真与策略评测](../simulation/closed_loop.md)。

视觉语言大模型（VLM）不仅能够增强自动驾驶的感知能力，更有潜力重塑决策与规划模块。传统的规则驱动和优化驱动规划方法在面对复杂、开放场景时往往缺乏灵活性和泛化能力，而 VLM 凭借其语义理解和常识推理能力，为自动驾驶决策规划提供了全新的技术范式。本页面系统阐述 VLM 在自动驾驶决策与规划中的核心方法、代表性架构及关键挑战。


## 1. 语言作为中间表征

### 1.1 核心思想

传统自动驾驶系统的中间表征通常是数值化的——向量、张量、占据栅格等。而**语言作为中间表征（Language as Intermediate Representation）** 则主张使用自然语言来桥接感知与规划：

$$
\text{感知输出} \xrightarrow{\text{语言描述}} \text{语义中间表征} \xrightarrow{\text{语言推理}} \text{决策与规划}
$$

VLM 将传感器输入（图像、点云等）转化为结构化的自然语言描述，再基于语言推理完成决策。这一范式的核心优势在于语言本身的三大特性。

### 1.2 优势分析

**可解释性（Interpretability）**

语言表征天然可读。当系统输出"前方 50 米处有行人正在横穿马路，决定减速让行"时，乘客和安全审查人员可以直接理解决策逻辑，无需对神经网络进行可视化解释。这对于 L3/L4 级自动驾驶的安全审计至关重要。

**组合泛化（Compositional Generalization）**

自然语言具有天然的**组合性**：词汇和语法规则可以自由组合以描述未见过的场景。例如，即使训练数据中从未出现"着火的卡车逆行"，模型仍然可以通过组合"着火"、"卡车"和"逆行"的语义来理解这一场景并作出合理决策。形式化地：

$$
\mathcal{G}(\text{"着火的卡车逆行"}) = f\bigl(\mathcal{G}(\text{"着火"}),\, \mathcal{G}(\text{"卡车"}),\, \mathcal{G}(\text{"逆行"})\bigr)
$$

其中 $\mathcal{G}$ 表示语义编码函数，$f$ 表示组合运算。

**跨域迁移（Cross-domain Transfer）**

语言描述是模态无关的。同一条"前方路口红灯，需停车等待"的语义指令可以在不同城市、不同天气、不同传感器配置下复用。这使得在模拟器中以语言形式积累的驾驶知识可以直接迁移到真实车辆上。

### 1.3 局限性

语言表征也存在固有局限：

- **精度损失**：语言难以精确描述连续数值（如"车辆在前方 37.2 m 处以 14.8 m/s 速度行驶"），量化误差不可避免
- **带宽瓶颈**：语言的信息密度低于结构化张量表征，描述复杂场景时信息有限
- **延迟开销**：生成和解析自然语言需要额外的推理时间


## 2. 链式推理（Chain-of-Thought）驾驶决策

### 2.1 CoT 推理流程

**链式推理（Chain-of-Thought, CoT）** 是将 VLM 应用于驾驶决策的核心技术之一。其基本思想是让模型逐步推理，将复杂的驾驶决策分解为有序的推理链：

$$
\mathcal{D} = \text{LLM}\bigl(P_{\text{scene}},\, P_{\text{risk}},\, P_{\text{intent}},\, P_{\text{action}} \mid \mathbf{V},\, \mathbf{H}\bigr)
$$

其中 $\mathbf{V}$ 为视觉输入，$\mathbf{H}$ 为历史上下文，$P_*$ 为各阶段的提示模板，$\mathcal{D}$ 为最终决策输出。完整的推理链包含四个阶段：

```
场景描述（Scene Description）
  → 风险评估（Risk Assessment）
    → 决策意图（Decision Intent）
      → 行动计划（Action Plan）
```

### 2.2 详细示例

以下展示一个完整的 CoT 推理过程：

```text
=== 输入 ===
[图像]: 前方十字路口的多视角相机图像
[车辆状态]: 速度 45 km/h，位于直行车道

=== 第一步：场景描述 ===
当前场景为城市十字路口，交通信号灯为绿灯。前方约 30 m 处有一辆
白色轿车正在左转，其转向灯已开启。右侧人行横道上有两名行人等待
过马路。左侧有一辆公交车正在进站停靠。路面干燥，能见度良好。

=== 第二步：风险评估 ===
- 高风险：前方左转车辆可能占用本车道，碰撞风险评分 0.7
- 中风险：右侧行人可能在信号灯变换时横穿，碰撞风险评分 0.4
- 低风险：左侧公交车正在停靠，暂无变道意图，碰撞风险评分 0.1

=== 第三步：决策意图 ===
鉴于前方左转车辆的高碰撞风险，应采取预防性减速策略。同时保持
对右侧行人的持续关注。决策意图：减速通过路口，为左转车辆预留
安全空间。

=== 第四步：行动计划 ===
1. 在未来 2 秒内将速度从 45 km/h 降至 30 km/h
2. 保持当前车道，不变道
3. 与前方左转车辆保持至少 15 m 的纵向安全距离
4. 持续监测右侧行人动态，若行人进入车道则进一步制动
```

### 2.3 CoT 推理的形式化

CoT 推理可以形式化为条件概率的链式分解：

$$
P(\mathcal{A} \mid \mathbf{V}) = \sum_{\mathcal{S}, \mathcal{R}, \mathcal{I}} P(\mathcal{A} \mid \mathcal{I})\, P(\mathcal{I} \mid \mathcal{R})\, P(\mathcal{R} \mid \mathcal{S})\, P(\mathcal{S} \mid \mathbf{V})
$$

其中 $\mathcal{S}$ 为场景描述、$\mathcal{R}$ 为风险评估、$\mathcal{I}$ 为决策意图、$\mathcal{A}$ 为行动计划。逐步推理的好处在于每一步都可以独立验证和调试，极大提升了系统的可解释性和可维护性。


## 3. 双系统架构

### 3.1 设计动机

VLM 的推理能力强大，但推理延迟通常在数百毫秒到数秒之间，无法满足实时控制的要求（通常需要 10–50 ms 的控制周期）。**双系统架构（Dual-system Architecture）** 借鉴认知科学中"系统 1 / 系统 2"的理论，将慢速的 VLM 推理与快速的轨迹执行网络解耦。

### 3.2 DriveVLM 架构

**DriveVLM**（Tian et al., 2024）是双系统架构的代表性工作，其核心设计如下：

| 组件 | 功能 | 频率 | 延迟 |
|:---:|:---:|:---:|:---:|
| VLM 慢思考模块 | 场景理解、CoT 推理、高层决策 | 1–2 Hz | 500–2000 ms |
| 轨迹生成网络 | 基于 VLM 输出的语义指导生成轨迹 | 10–20 Hz | 20–50 ms |
| 安全检查模块 | 碰撞检测与约束验证 | 20 Hz | < 10 ms |

工作流程如下：

1. **VLM 慢思考**：以较低频率（约 1 Hz）处理多视角图像，输出场景描述、风险评估和高层驾驶意图
2. **语义-轨迹桥接**：将 VLM 的语义输出编码为条件向量 $\mathbf{c}_{\text{vlm}}$，注入轨迹生成网络
3. **快速轨迹生成**：轨迹网络以高频率运行，生成未来 $T$ 个时间步的轨迹点：

$$
\boldsymbol{\tau} = \{(x_t, y_t, \theta_t)\}_{t=1}^{T} = g_\phi(\mathbf{F}_{\text{bev}},\, \mathbf{c}_{\text{vlm}})
$$

其中 $\mathbf{F}_{\text{bev}}$ 为 BEV 特征，$g_\phi$ 为轨迹解码器。

### 3.3 延迟解耦策略

双系统之间的延迟解耦是关键设计点：

- **异步执行**：VLM 模块和轨迹网络运行在不同线程/进程中，VLM 输出结果后缓存，轨迹网络从缓存读取最新的语义指导
- **插值更新**：在两次 VLM 推理之间，通过对语义条件向量进行线性插值来平滑过渡
- **紧急覆写**：当安全检查模块检测到即将发生碰撞时，直接覆写 VLM 指令，触发紧急制动


## 4. LLM 直接生成轨迹

### 4.1 GPT-Driver 方法

**GPT-Driver**（Mao et al., 2023）探索了一条更为激进的路径：让 LLM 直接以文本形式生成驾驶轨迹。

核心思想是**轨迹标记化（Trajectory Tokenization）**：将连续的轨迹坐标离散化为文本 Token，使 LLM 能够用生成文本的方式生成轨迹。

### 4.2 轨迹标记化

给定未来 $T$ 步的目标轨迹 $\boldsymbol{\tau} = \{(x_t, y_t)\}_{t=1}^{T}$，对每个坐标进行量化：

$$
\hat{x}_t = \text{round}\left(\frac{x_t - x_{\min}}{\Delta}\right), \quad \hat{y}_t = \text{round}\left(\frac{y_t - y_{\min}}{\Delta}\right)
$$

其中 $\Delta$ 为量化步长（如 0.1 m）。量化后的坐标被转化为文本序列：

```text
<TRAJ> (152, 34) (155, 33) (159, 31) (164, 29) (170, 27) (177, 25) </TRAJ>
```

### 4.3 自回归轨迹生成

LLM 以自回归方式逐 Token 生成轨迹：

$$
P(\boldsymbol{\tau} \mid \mathbf{V}, \mathbf{H}) = \prod_{t=1}^{T} P\bigl((\hat{x}_t, \hat{y}_t) \mid (\hat{x}_{<t}, \hat{y}_{<t}),\, \mathbf{V},\, \mathbf{H}\bigr)
$$

这种方法的优势在于可以直接复用 LLM 强大的序列建模能力，并且通过 CoT 提示可以让模型先输出驾驶理由再输出轨迹，提升可解释性。

### 4.4 挑战

- **量化误差**：轨迹的离散化不可避免地引入精度损失
- **物理不可行性**：LLM 生成的轨迹可能违反车辆运动学约束（如曲率过大）
- **累积误差**：自回归生成中的误差会逐步累积


## 5. LLM 参数调节控制器

### 5.1 LanguageMPC

**LanguageMPC**（Sha et al., 2023）提出了一种更加保守但实用的集成方案：LLM 不直接生成轨迹，而是输出**模型预测控制（MPC）** 控制器的参数调节量。

### 5.2 架构设计

系统工作流程为：

1. VLM 分析当前驾驶场景，生成自然语言描述和驾驶建议
2. LLM 将驾驶建议映射为 MPC 代价函数的参数调节量 $\Delta \mathbf{w}$
3. MPC 控制器使用调节后的参数 $\mathbf{w} + \Delta \mathbf{w}$ 求解最优轨迹

MPC 的代价函数为：

$$
J(\boldsymbol{\tau}) = \sum_{i} (w_i + \Delta w_i)\, C_i(\boldsymbol{\tau})
$$

其中 $C_i$ 为各项代价分量（安全距离、舒适性、效率等），$w_i$ 为基础权重，$\Delta w_i$ 为 LLM 输出的调节量。

### 5.3 示例

```text
=== VLM 场景分析 ===
前方为学校区域，路边有多名儿童，当前时间为放学时段。

=== LLM 参数调节输出 ===
{
  "speed_limit_weight": +0.5,    // 增大限速代价，鼓励降速
  "safety_distance_weight": +0.8, // 增大安全距离代价
  "comfort_weight": -0.2,         // 适当降低舒适性要求（允许更急的制动）
  "efficiency_weight": -0.3       // 降低效率优先级
}
```

### 5.4 优势

- **安全保障**：轨迹始终由 MPC 求解器生成，满足运动学和动力学约束
- **可解释性**：LLM 的参数调节量具有明确的物理含义
- **渐进部署**：可以在传统 MPC 系统上逐步引入 LLM，降低工程风险


## 6. 端到端多模态驾驶

### 6.1 LMDrive

**LMDrive**（Shao et al., 2024）实现了真正的端到端多模态驾驶系统，其核心创新在于将**图像、LiDAR 点云和自然语言导航指令**统一到一个多模态框架中。

### 6.2 输入模态

| 模态 | 输入形式 | 编码方式 |
|:---:|:---:|:---:|
| 视觉 | 多视角相机图像 | ViT 视觉编码器 |
| LiDAR | 3D 点云 | 体素化 + 3D 稀疏卷积 |
| 语言 | 导航指令（如"下个路口左转"） | LLM 文本编码器 |

### 6.3 模型架构

LMDrive 的架构可概括为：

$$
(\delta_{\text{steer}},\, a_{\text{throttle}},\, a_{\text{brake}}) = h_\psi\bigl(\text{LLM}(\mathbf{F}_{\text{img}},\, \mathbf{F}_{\text{lidar}},\, \mathbf{T}_{\text{nav}})\bigr)
$$

其中 $\mathbf{F}_{\text{img}}$ 和 $\mathbf{F}_{\text{lidar}}$ 分别为图像和 LiDAR 特征，$\mathbf{T}_{\text{nav}}$ 为导航指令的 Token 序列，$h_\psi$ 为控制头网络。

关键技术细节：

- **多模态对齐**：通过可学习的投影层将视觉和 LiDAR 特征映射到 LLM 的 Token 空间
- **指令跟随**：模型需要理解自然语言导航指令并将其转化为具体的驾驶行为
- **时序建模**：输入包含过去 $K$ 帧的多模态信息，以捕捉动态变化

### 6.4 训练策略

LMDrive 采用两阶段训练：

1. **预训练阶段**：在大规模驾驶数据集上进行视觉-语言对齐预训练，使模型学会理解驾驶场景
2. **微调阶段**：在包含导航指令的驾驶数据上进行端到端微调，使模型学会根据指令控制车辆


## 7. 图结构推理

### 7.1 DriveLM 方法

**DriveLM**（Sima et al., 2024）提出了基于**图结构视觉问答（Graph-based VQA）** 的驾驶推理方法。其核心思想是将驾驶场景的推理过程组织为一个有向无环图（DAG），节点为问答对，边表示推理依赖关系。

### 7.2 感知-预测-规划图结构

DriveLM 将驾驶推理分为三层，形成层次化的图结构：

```text
┌─────────────────────────────────────────────────────┐
│  感知层（Perception）                                │
│  Q: 前方白色车辆的位置和速度？                        │
│  A: 前方 25 m，速度约 40 km/h，正在减速              │
│       ↓                    ↓                        │
│  预测层（Prediction）                                │
│  Q: 该车辆未来 3 秒的行为预测？                       │
│  A: 预计将在前方 10 m 处停车（概率 0.8）              │
│       ↓                                             │
│  规划层（Planning）                                  │
│  Q: 本车应采取什么行动？                              │
│  A: 提前减速，保持 15 m 安全距离                      │
└─────────────────────────────────────────────────────┘
```

### 7.3 图推理的形式化

令 $\mathcal{G} = (\mathcal{V}, \mathcal{E})$ 为推理图，其中节点 $v_i \in \mathcal{V}$ 表示问答对 $(q_i, a_i)$，有向边 $(v_i, v_j) \in \mathcal{E}$ 表示 $v_j$ 的回答依赖于 $v_i$ 的回答。推理过程遵循拓扑序：

$$
a_j = \text{VLM}\bigl(q_j,\, \mathbf{V},\, \{a_i \mid (v_i, v_j) \in \mathcal{E}\}\bigr)
$$

即每个节点的回答条件于其所有父节点的回答。这种图结构确保了推理的逻辑一致性和层次性。

### 7.4 优势

- **结构化推理**：图结构强制模型遵循从感知到预测到规划的逻辑顺序
- **可追溯性**：每个规划决策都可以追溯到其依赖的感知和预测节点
- **灵活性**：图结构可以根据场景复杂度动态扩展


## 8. 安全约束集成

### 8.1 核心挑战

VLM 的生成特性意味着其输出可能存在**幻觉（Hallucination）**、**不一致性**和**物理不可行性**。在安全攸关的自动驾驶场景中，必须确保 VLM 的决策输出不会导致危险行为。

### 8.2 安全监控层

安全监控层（Safety Monitor）是一个独立于 VLM 的验证模块，对 VLM 的每一个决策输出进行安全检查：

$$
\mathcal{A}_{\text{final}} = \begin{cases}
\mathcal{A}_{\text{vlm}} & \text{若 } \mathcal{A}_{\text{vlm}} \in \mathcal{S}_{\text{safe}} \\
\mathcal{A}_{\text{fallback}} & \text{否则}
\end{cases}
$$

其中 $\mathcal{S}_{\text{safe}}$ 为安全动作集合，$\mathcal{A}_{\text{fallback}}$ 为回退安全动作（如保持当前车道、匀速行驶或紧急制动）。

### 8.3 否决机制（Veto Mechanism）

否决机制的核心是一组硬性安全约束：

- **碰撞约束**：规划轨迹的任意时刻与任何障碍物的距离不得小于安全阈值 $d_{\min}$
- **运动学约束**：轨迹的曲率、加速度、横摆率不得超过车辆物理极限
- **交通规则约束**：不得违反红灯停车、限速等基本交通法规
- **舒适性约束**：横向和纵向加速度不得超过乘客舒适阈值

当 VLM 输出的决策或轨迹违反上述任何约束时，否决机制立即触发：

1. 丢弃 VLM 的当前输出
2. 激活回退策略（通常为保守的跟车或停车行为）
3. 记录否决事件以供后续分析和模型改进

### 8.4 形式化安全保证

结合**控制屏障函数（Control Barrier Function, CBF）** 可以提供形式化的安全保证。定义安全集合 $\mathcal{C} = \{x \mid h(x) \geq 0\}$，CBF 约束要求：

$$
\dot{h}(x, u) + \alpha\bigl(h(x)\bigr) \geq 0
$$

其中 $\alpha$ 为扩展类 $\mathcal{K}$ 函数。该约束确保系统状态始终不会离开安全集合，即使 VLM 给出了不安全的决策。


## 9. 与传统规划器的融合策略

### 9.1 融合的必要性

纯粹依赖 VLM 进行决策规划面临延迟高、确定性低、难以验证等挑战，而传统规划器（如 lattice planner、RRT*、MPC 等）虽然在开放场景下灵活性不足，但在确定性、实时性和安全性方面具有明确优势。实际部署中通常需要两者的深度融合。

### 9.2 层次化集成模式

| 集成层级 | VLM 角色 | 传统规划器角色 | 示例 |
|:---:|:---:|:---:|:---:|
| 战略层 | 路线规划、场景理解 | 不参与 | VLM 判断"前方道路封闭，需绕行" |
| 战术层 | 行为决策（变道、超车） | 候选行为评估 | VLM 建议变道，规划器验证可行性 |
| 执行层 | 不直接参与 | 轨迹优化与跟踪 | MPC 生成满足约束的平滑轨迹 |

### 9.3 信任度动态分配

何时信任 VLM、何时信任传统规划器，是融合系统的关键设计问题。一种常见策略是基于**场景复杂度**动态分配信任度：

$$
\mathbf{w}_{\text{vlm}} = \sigma\bigl(\beta \cdot (\mathcal{C}_{\text{scene}} - \mathcal{C}_{\text{threshold}})\bigr)
$$

其中 $\mathcal{C}_{\text{scene}}$ 为场景复杂度评分（由 VLM 自身或独立模块估计），$\mathcal{C}_{\text{threshold}}$ 为阈值，$\sigma$ 为 sigmoid 函数，$\beta$ 为温度参数。

- **简单场景**（高速公路直行、空旷道路）：$\mathbf{w}_{\text{vlm}}$ 较低，传统规划器主导
- **复杂场景**（无保护左转、施工区域、异常事件）：$\mathbf{w}_{\text{vlm}}$ 较高，VLM 主导决策

### 9.4 回退机制

当 VLM 模块发生异常（推理超时、输出异常、置信度过低）时，系统应无缝切换到传统规划器：

- **热备份**：传统规划器始终在后台运行，维持一条可执行轨迹
- **平滑切换**：切换时对轨迹进行时间插值，避免控制量跳变
- **降级告警**：通知乘客系统已降级运行，建议人工接管


## 10. 性能基准对比

### 10.1 nuScenes 规划基准

以下数据汇总了代表性方法在 nuScenes 规划基准上的表现。评估指标包括 L2 位移误差（1s/2s/3s）、碰撞率（1s/2s/3s）以及推理延迟。

| 方法 | 类型 | L2 (1s) ↓ | L2 (2s) ↓ | L2 (3s) ↓ | 碰撞率 (1s) ↓ | 碰撞率 (3s) ↓ | 延迟 (ms) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ST-P3 | 端到端 | 1.33 | 2.11 | 2.90 | 0.23% | 1.27% | 82 |
| UniAD | 端到端 | 0.48 | 0.96 | 1.65 | 0.05% | 0.71% | 333 |
| GPT-Driver | LLM 轨迹 | 0.41 | 0.89 | 1.54 | 0.04% | 0.64% | 1200 |
| DriveVLM | 双系统 | 0.39 | 0.83 | 1.48 | 0.04% | 0.56% | 450* |
| LanguageMPC | LLM+MPC | 0.45 | 0.91 | 1.58 | 0.03% | 0.52% | 380* |
| LMDrive | 端到端多模态 | 0.42 | 0.87 | 1.53 | 0.04% | 0.59% | 520 |
| DriveLM | 图推理 | 0.40 | 0.86 | 1.51 | 0.04% | 0.58% | 890 |

> \* 标注的延迟为轨迹输出延迟（不含 VLM 异步推理延迟）。

### 10.2 关键观察

1. **精度提升**：VLM 增强的方法在 L2 误差上相比纯端到端基线（如 ST-P3）有显著提升，3s L2 误差降低约 40–50%
2. **碰撞率改善**：LanguageMPC 凭借 MPC 求解器的硬约束保证，在碰撞率指标上表现最优
3. **延迟-精度权衡**：双系统架构（DriveVLM）在精度和延迟之间取得了较好的平衡
4. **推理成本**：纯 LLM 生成轨迹的方法（GPT-Driver）延迟最高，实际部署需要显著优化

### 10.3 开放挑战

- **闭环评测缺失**：当前大部分评测基于开环（与录制轨迹对比），闭环评测（如 CARLA 仿真）更能反映真实性能
- **长尾场景覆盖不足**：标准基准中长尾场景的比例有限，VLM 的泛化优势尚未被充分体现
- **计算资源需求**：VLM 方法通常需要 A100 级别的 GPU，距离车载部署仍有差距


## 参考资料

1. Tian, X., et al. "DriveVLM: The Convergence of Autonomous Driving and Large Vision-Language Models." *arXiv preprint arXiv:2402.12289*, 2024.
2. Mao, J., et al. "GPT-Driver: Learning to Drive with GPT." *arXiv preprint arXiv:2310.01415*, 2023.
3. Sha, H., et al. "LanguageMPC: Large Language Models as Decision Makers for Autonomous Driving." *arXiv preprint arXiv:2310.03026*, 2023.
4. Shao, H., et al. "LMDrive: Closed-Loop End-to-End Driving with Large Language Models." *CVPR*, 2024.
5. Sima, C., et al. "DriveLM: Driving with Graph Visual Question Answering." *arXiv preprint arXiv:2312.14150*, 2024.
6. Hu, Y., et al. "Planning-oriented Autonomous Driving." *CVPR*, 2023. (UniAD)
7. Hu, S., et al. "ST-P3: End-to-end Vision-based Autonomous Driving via Spatial-Temporal Feature Learning." *ECCV*, 2022.
8. Wei, J., et al. "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." *NeurIPS*, 2022.
9. Ames, A.D., et al. "Control Barrier Functions: Theory and Applications." *European Control Conference*, 2019.
10. Cui, C., et al. "A Survey on Multimodal Large Language Models for Autonomous Driving." *arXiv preprint arXiv:2311.12320*, 2023.
