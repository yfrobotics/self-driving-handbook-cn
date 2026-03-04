# 世界模型与神经场景表示

## 1. 开篇介绍

自动驾驶系统的核心挑战之一在于：如何让车辆在采取行动之前，准确地"想象"未来世界可能的演变。人类驾驶员在变道、超车、通过路口时，脑中会不自觉地模拟"如果我现在打方向盘，周围车辆和行人会如何反应"——这种心智模拟（Mental Simulation）能力正是**世界模型（World Model）**试图赋予自动驾驶系统的核心能力。

**世界模型**是指能够对环境动力学进行建模的神经网络系统，给定当前状态和动作，它可以预测未来状态的演化。形式化地，世界模型包含两个核心组件：

$$s_{t+1} = f_\theta(s_t, a_t) \quad \text{（状态转移模型）}$$

$$\hat{o}_{t+1} = g_\theta(s_{t+1}) \quad \text{（观测解码器）}$$

其中 $s_t$ 为 $t$ 时刻的世界状态（可以是隐状态或显式场景表示），$a_t$ 为自车动作，$\hat{o}_{t+1}$ 为预测的观测（图像、点云或占用体积）。

与此同时，**神经场景表示（Neural Scene Representation）**作为世界模型的底层基础设施，提供了对三维驾驶场景的高保真建模能力。从神经辐射场（NeRF）到3D高斯泼溅（3D Gaussian Splatting），这些技术使得从有限传感器数据中重建可渲染、可交互的三维场景成为可能。

世界模型在自动驾驶中的价值可以从三个层面理解：

1. **桥接感知与预测**：传统管线中感知和预测是独立模块，世界模型将两者统一为"对世界动态的整体理解"
2. **赋能想象式规划**：在世界模型的隐空间中搜索最优动作序列，无需在真实世界中试错
3. **生成仿真数据**：世界模型可以生成逼真的驾驶场景视频，用于闭环仿真和长尾场景覆盖

```
世界模型在自动驾驶系统中的位置：

┌──────────────────────────────────────────────────────────────┐
│                    自动驾驶系统                                │
│                                                                │
│  传感器输入 ──→ [感知模块] ──→ 场景表示 ──→ [预测模块]        │
│                                    ↕                           │
│                             ┌──────────────┐                   │
│                             │   世界模型    │                   │
│                             │  状态转移模型 │                   │
│                             │  观测解码器   │                   │
│                             │  奖励预测器   │                   │
│                             └──────┬───────┘                   │
│                                    ↓                           │
│                             想象式规划                          │
│                             "如果执行 a，                      │
│                              世界会怎样？"                     │
│                                    ↓                           │
│                             [规划与控制] ──→ 车辆执行           │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 从占用网络到世界模型

### 2.1 技术演进脉络

自动驾驶对三维场景的建模经历了从简单离散化到神经网络隐式表达的深刻演变。每一代技术都在前一代的基础上解决其核心局限，最终收敛到世界模型这一统一框架。

**第一代：传统占用栅格（Occupancy Grid, 1989）**

Elfes 于 1989 年提出的占用栅格地图将环境离散化为均匀的二维/三维栅格，每个栅格存储被障碍物占据的概率。更新方式基于贝叶斯滤波：

$$l_t(m) = l_{t-1}(m) + \log\frac{P(z_t | m = \text{occ})}{P(z_t | m = \text{free})}$$

**局限**：分辨率固定，无法表达精细几何；无语义信息；无法处理动态场景。

**第二代：学习型占用网络（OccNet, 2022-2023）**

以特斯拉 2022 AI Day 发布的 Occupancy Network 为标志，利用深度神经网络从摄像头图像直接预测三维语义占用体积 $\mathbf{V} \in \mathbb{R}^{H \times W \times D \times C}$。相比传统方法，学习型占用网络可以感知任意形状障碍物，并提供语义标签。

**局限**：仅描述当前时刻的静态场景，无法预测未来；无法生成逼真的传感器观测。

**第三代：神经场景表示（NeRF / 3DGS, 2020-2023）**

以 NeRF 和 3D Gaussian Splatting 为代表，通过可微分渲染实现从任意视角合成逼真图像。这些技术使得驾驶场景的三维重建和新视角渲染成为可能。

**局限**：侧重静态场景重建，对动态物体建模能力有限；不具备预测未来状态的能力。

**第四代：世界模型（World Model, 2023-至今）**

将场景表示与动力学模型结合，不仅能表达当前场景，还能预测"如果执行动作 $a$，世界将如何演变"。世界模型整合了前三代技术的优势，成为自动驾驶感知-预测-规划一体化的核心。

### 2.2 各代技术对比

| 技术代际 | 代表方法 | 场景几何 | 语义理解 | 动态建模 | 未来预测 | 新视角合成 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 传统占用栅格 | Elfes OG | 粗粒度 | 无 | 无 | 无 | 无 |
| 学习型占用 | OccNet, TPVFormer | 精细 | 有 | 部分（占用流） | 有限 | 无 |
| 神经场景表示 | NeRF, 3DGS | 高保真 | 有限 | 有限 | 无 | 有 |
| 世界模型 | GAIA-1, GenAD | 高保真 | 有 | 有 | 有 | 有 |

### 2.3 统一视角

从统一视角来看，世界模型可以被理解为"可预测未来的、动作可控的、可渲染的场景表示"。它将占用网络的几何精确性、神经场景表示的渲染能力、以及动力学模型的预测能力融为一体：

$$\text{世界模型} = \text{场景表示} + \text{动力学模型} + \text{渲染器}$$

---

## 3. 神经辐射场（NeRF）

### 3.1 基本原理

**神经辐射场（Neural Radiance Field, NeRF）**由 Mildenhall 等人于 2020 年提出，是一种利用神经网络隐式表达三维场景的方法。其核心思想是将场景建模为一个连续的五维函数，从三维位置 $(x, y, z)$ 和观察方向 $(\theta, \phi)$ 映射到颜色 $\mathbf{c}$ 和体密度 $\sigma$：

$$F_\Theta: (\mathbf{x}, \mathbf{d}) \rightarrow (\mathbf{c}, \sigma)$$

其中 $\mathbf{x} = (x, y, z)$ 为空间位置，$\mathbf{d} = (\theta, \phi)$ 为观察方向，$\mathbf{c} = (r, g, b)$ 为颜色，$\sigma$ 为体密度（描述该点被物质占据的程度）。

**体渲染方程（Volume Rendering Equation）**是 NeRF 的物理基础。沿射线 $\mathbf{r}(t) = \mathbf{o} + t\mathbf{d}$ 从近平面 $t_n$ 到远平面 $t_f$ 积分，得到该像素的颜色：

$$\hat{C}(\mathbf{r}) = \int_{t_n}^{t_f} T(t) \cdot \sigma(\mathbf{r}(t)) \cdot \mathbf{c}(\mathbf{r}(t), \mathbf{d}) \, dt$$

其中 $T(t)$ 为累积透射率，表示射线从 $t_n$ 到 $t$ 之间未被遮挡的概率：

$$T(t) = \exp\left(-\int_{t_n}^{t} \sigma(\mathbf{r}(s)) \, ds\right)$$

在实际计算中，采用分层采样（Stratified Sampling）将连续积分离散化为 $N$ 个采样点的加权求和：

$$\hat{C}(\mathbf{r}) = \sum_{i=1}^{N} T_i \cdot \alpha_i \cdot \mathbf{c}_i, \quad \alpha_i = 1 - \exp(-\sigma_i \delta_i), \quad T_i = \prod_{j=1}^{i-1}(1 - \alpha_j)$$

其中 $\delta_i = t_{i+1} - t_i$ 为相邻采样点之间的距离。

### 3.2 位置编码

NeRF 使用**位置编码（Positional Encoding）**将低维坐标映射到高维空间，以使 MLP 能够拟合高频几何和纹理细节：

$$\gamma(\mathbf{x}) = \left[\sin(2^0 \pi \mathbf{x}), \cos(2^0 \pi \mathbf{x}), \ldots, \sin(2^{L-1} \pi \mathbf{x}), \cos(2^{L-1} \pi \mathbf{x})\right]$$

对于位置坐标通常取 $L = 10$（映射到 60 维），对于方向坐标取 $L = 4$（映射到 24 维）。

### 3.3 NeRF 在自动驾驶场景重建中的应用

NeRF 在自动驾驶领域的应用面临特殊挑战：驾驶场景是大规模的、开放的、包含动态物体的户外环境，与 NeRF 原始论文中的小型静态物体场景有本质不同。

**Block-NeRF（Waymo, 2022）**：

Block-NeRF 将大规模城市场景分解为多个子区域（Block），每个子区域由独立的 NeRF 模型表示，然后通过外观匹配和空间混合进行无缝拼接：

- 覆盖范围：旧金山多个街区的城市级重建
- 数据来源：Waymo 自动驾驶车辆的行驶记录
- 支持视角外推：可从从未拍摄过的视角渲染场景

**Urban Radiance Fields（2022）**：

针对城市街景的 NeRF 扩展，引入 LiDAR 深度监督以提升几何精度：

$$\mathcal{L} = \mathcal{L}_\text{color} + \lambda_d \mathcal{L}_\text{depth} + \lambda_s \mathcal{L}_\text{sky}$$

其中 $\mathcal{L}_\text{depth}$ 利用 LiDAR 点云提供的精确深度约束 NeRF 的几何重建，$\mathcal{L}_\text{sky}$ 对天空区域施加无穷远深度约束。

**UniSim（NVIDIA, 2023）**：

UniSim 是 NVIDIA 提出的神经场景模拟器，将 NeRF 场景重建与动态物体建模结合，构建可交互的驾驶仿真环境：

- 从传感器日志重建静态背景的神经辐射场
- 可在重建场景中插入、移除、移动动态物体
- 支持从任意视角渲染逼真的摄像头图像和 LiDAR 点云

### 3.4 NeRF 的局限性

| 局限 | 具体表现 | 对自动驾驶的影响 |
|:---:|:---:|:---:|
| 渲染速度慢 | 每像素需要数百次网络前向传播 | 无法满足实时仿真需求 |
| 静态场景假设 | 难以处理运动车辆、行人 | 驾驶场景本质上是动态的 |
| 训练时间长 | 单个场景需数小时至数天 | 大规模场景重建效率低 |
| 视角外推能力弱 | 偏离训练视角时质量急剧下降 | 限制了仿真中的自由探索 |
| 无几何保证 | 隐式表示难以提取精确几何 | 碰撞检测等需要显式几何 |

---

## 4. 3D 高斯泼溅（Gaussian Splatting）

### 4.1 基本原理

**3D 高斯泼溅（3D Gaussian Splatting, 3DGS）**由 Kerbl 等人于 2023 年提出，是一种基于显式高斯基元的三维场景表示方法。与 NeRF 的隐式表示不同，3DGS 使用一组显式的三维高斯函数来表示场景。

每个高斯基元由以下属性定义：

- **位置**（均值）：$\boldsymbol{\mu} \in \mathbb{R}^3$
- **协方差矩阵**：$\boldsymbol{\Sigma} \in \mathbb{R}^{3 \times 3}$（描述形状和方向）
- **不透明度**：$\alpha \in [0, 1]$
- **颜色**：用球谐函数（Spherical Harmonics, SH）系数表示，支持视角相关的外观

三维高斯函数定义为：

$$G(\mathbf{x}) = \exp\left(-\frac{1}{2}(\mathbf{x} - \boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1} (\mathbf{x} - \boldsymbol{\mu})\right)$$

为保证协方差矩阵半正定，实际中将其分解为旋转矩阵 $\mathbf{R}$（由四元数 $\mathbf{q}$ 参数化）和缩放矩阵 $\mathbf{S}$（对角矩阵）：

$$\boldsymbol{\Sigma} = \mathbf{R} \mathbf{S} \mathbf{S}^T \mathbf{R}^T$$

### 4.2 可微分光栅化

3DGS 的渲染过程采用**可微分光栅化（Differentiable Rasterization）**，将三维高斯投影到二维图像平面进行高效渲染。

给定相机的视图变换矩阵 $\mathbf{W}$ 和投影矩阵 $\mathbf{J}$，三维协方差矩阵投影到二维为：

$$\boldsymbol{\Sigma}' = \mathbf{J} \mathbf{W} \boldsymbol{\Sigma} \mathbf{W}^T \mathbf{J}^T$$

像素颜色通过前到后的 $\alpha$-混合（Alpha Blending）计算：

$$C = \sum_{i \in \mathcal{N}} c_i \cdot \alpha_i \cdot \prod_{j=1}^{i-1}(1 - \alpha_j)$$

其中 $\alpha_i$ 由高斯在该像素处的值与不透明度相乘得到，$\mathcal{N}$ 为按深度排序的重叠高斯集合。

### 4.3 与 NeRF 的核心对比

| 特性 | NeRF | 3D Gaussian Splatting |
|:---:|:---:|:---:|
| 场景表示 | 隐式（MLP 权重） | 显式（高斯基元集合） |
| 渲染方式 | 体积光线行进（Ray Marching） | 光栅化（Rasterization） |
| 渲染速度 | 慢（每像素数百次 MLP 推理） | 实时（> 100 FPS） |
| 训练速度 | 数小时 | 数分钟至数十分钟 |
| 几何提取 | 困难（需 Marching Cubes 后处理） | 直接（高斯中心即几何） |
| 内存占用 | 低（仅存储 MLP 参数） | 高（数百万高斯基元） |
| 编辑能力 | 差（修改需重训练） | 好（直接操作高斯基元） |

### 4.4 在自动驾驶中的应用

**Street Gaussians（2024）**：

Street Gaussians 将 3DGS 应用于城市街道场景的重建与渲染，并引入了动态物体建模：

- 将场景分解为**静态背景**（用标准 3DGS 表示）和**动态前景**（每个动态物体用独立的 3DGS + 仿射变换序列表示）
- 支持动态物体的移除、插入和轨迹修改
- 渲染速度达到 133 FPS，满足实时仿真需求

**DrivingGaussian（2024）**：

DrivingGaussian 提出了大规模驾驶场景的增量式高斯重建框架：

- **增量式重建**：随着车辆行驶，逐帧添加新的高斯基元，支持任意长度轨迹的场景重建
- **组合式动态场景**：静态背景 + 可控动态物体 + 可编辑天气/光照条件
- **LiDAR 先验**：利用 LiDAR 点云初始化高斯位置，大幅提升几何精度

**GaussianFormer（2024）**：

将 3DGS 的理念引入端到端感知，用高斯基元作为三维场景的稀疏表示，替代密集的体素占用：

$$\mathbf{S} = \{(\boldsymbol{\mu}_i, \boldsymbol{\Sigma}_i, \mathbf{f}_i)\}_{i=1}^{M}$$

其中 $\mathbf{f}_i$ 为语义特征向量。通过可微分泼溅将高斯语义特征渲染到 BEV 空间，实现高效的三维场景理解。

### 4.5 动态场景建模

3DGS 对动态场景的建模主要有两种思路：

**基于变形场的方法**：学习一个时变变形场 $\mathcal{D}: (\mathbf{x}, t) \rightarrow \Delta\mathbf{x}$，将规范空间（Canonical Space）中的高斯基元变形到每个时间步的实际位置：

$$\boldsymbol{\mu}_i(t) = \boldsymbol{\mu}_i^{\text{canon}} + \mathcal{D}(\boldsymbol{\mu}_i^{\text{canon}}, t)$$

**基于刚体变换的方法**：对每个动态物体（由检测和追踪系统提供标识），维护逐帧的刚体变换 $(\mathbf{R}_t, \mathbf{t}_t)$：

$$\boldsymbol{\mu}_i(t) = \mathbf{R}_t \boldsymbol{\mu}_i^{\text{local}} + \mathbf{t}_t$$

后者更适合自动驾驶场景，因为车辆和行人的运动可以很好地近似为刚体运动。

---

## 5. 潜在世界模型

### 5.1 潜在空间建模的动机

直接在像素空间（原始图像）或体素空间（占用体积）建模世界动力学面临严重的维度灾难：一帧 1920x1080 的图像包含超过 600 万个像素值，在如此高维空间中学习时序动态极其困难。

**潜在世界模型（Latent World Model）**的核心思想是：先将高维观测压缩到低维**潜在空间（Latent Space）**，然后在潜在空间中学习动力学转移模型。这一思路源自变分自编码器（VAE）和 Dreamer 系列工作：

$$z_t = \text{Encoder}(o_t) \quad \text{（编码器：观测→潜在状态）}$$

$$\hat{z}_{t+1} = f_\theta(z_t, a_t) \quad \text{（潜在动力学模型）}$$

$$\hat{o}_{t+1} = \text{Decoder}(\hat{z}_{t+1}) \quad \text{（解码器：潜在状态→观测）}$$

训练目标综合重建损失和 KL 正则化：

$$\mathcal{L} = \mathbb{E}\left[\sum_t \|o_t - \hat{o}_t\|^2\right] + \beta \cdot D_\text{KL}\left(q_\phi(z_t | o_t) \| p_\theta(z_t | z_{t-1}, a_{t-1})\right)$$

### 5.2 GAIA-1（Wayve, 2023）

**GAIA-1** 是 Wayve 于 2023 年发布的首个专门为自动驾驶设计的大规模生成式视频世界模型，参数规模约 93 亿。

**架构设计**：

```
输入条件:
  ├── 驾驶历史视频帧序列 (过去 N 帧)
  ├── 自车动作序列 (转向角, 油门/制动)
  └── 文本条件 (可选, 如 "城市道路" "雨天")
        │
        ▼
  视频 Tokenizer (VQ-VAE)
  → 视频 token 序列
        │
        ▼
  自回归 Transformer (GPT 风格)
  → 预测下一个视频 token
        │
        ▼
  Token 解码器
  → 未来驾驶视频帧
```

**核心能力**：

1. **动作条件生成**：给定不同的自车动作序列，生成对应的未来视频。例如，同一时刻分别输入"直行"和"左转"的动作，生成两种完全不同的未来场景
2. **反事实推理**：模拟"如果此刻急刹车/急转弯会发生什么"
3. **场景条件控制**：通过文本条件改变天气、时间、交通密度等

### 5.3 DriveDreamer（2023）

**DriveDreamer** 基于扩散模型（Diffusion Model）生成驾驶场景视频，以结构化道路信息为条件约束生成的空间一致性：

$$\mathbf{x}_{t-1} = \frac{1}{\sqrt{\alpha_t}}\left(\mathbf{x}_t - \frac{1 - \alpha_t}{\sqrt{1 - \bar{\alpha}_t}}\epsilon_\theta(\mathbf{x}_t, t, \mathbf{c})\right) + \sigma_t \mathbf{z}$$

其中条件 $\mathbf{c}$ 包含高精地图（车道线、路口结构）、3D 交通参与者边界框序列和自车轨迹。扩散模型的条件注入机制确保生成视频在几何上与输入条件一致。

相比 GAIA-1 的自回归生成，DriveDreamer 的扩散模型方案在多帧时序一致性上具有优势，且支持多摄像头同步生成。

### 5.4 GenAD（2024）

**GenAD（Generative End-to-End Autonomous Driving）**将世界模型与端到端规划深度融合，是潜在世界模型在自动驾驶中最具代表性的系统之一。

**核心创新**：

- 在潜在空间中同时进行场景预测和轨迹规划
- 使用**动作条件扩散模型**在潜在空间中生成未来场景表示
- 规划模块直接在预测的潜在空间中搜索最优轨迹

$$z_{t+1:t+H} = \text{LatentDiffusion}(z_t, a_{t:t+H-1})$$

$$a^* = \arg\min_{a} \mathcal{J}(z_{t+1:t+H}, a_{t:t+H-1})$$

其中 $\mathcal{J}$ 为包含安全性、舒适性和效率的多目标代价函数。

### 5.5 潜在动力学模型的数学框架

潜在世界模型的核心是**循环状态空间模型（Recurrent State Space Model, RSSM）**，将世界状态分解为确定性分量和随机分量：

$$h_t = f_\phi(h_{t-1}, z_{t-1}, a_{t-1}) \quad \text{（确定性状态，GRU 更新）}$$

$$\hat{z}_t \sim p_\phi(z_t | h_t) \quad \text{（先验分布，用于想象推演）}$$

$$z_t \sim q_\phi(z_t | h_t, o_t) \quad \text{（后验分布，用于训练时基于实际观测）}$$

训练时最小化先验与后验之间的 KL 散度，使得模型在没有实际观测时（想象模式）也能准确预测未来状态：

$$\mathcal{L}_\text{KL} = D_\text{KL}\left(q_\phi(z_t | h_t, o_t) \| p_\phi(z_t | h_t)\right)$$

### 5.6 主要潜在世界模型对比

| 模型 | 机构 | 参数规模 | 生成方式 | 条件输入 | 核心特点 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| GAIA-1 | Wayve | 9B | 自回归 | 视频+动作+文本 | 首个大规模驾驶世界模型 |
| DriveDreamer | 清华/理想 | ~1B | 扩散模型 | 地图+框+轨迹 | 结构化条件控制 |
| GenAD | 上海AI Lab | ~500M | 潜在扩散 | BEV+动作 | 规划与世界模型统一 |
| DreamerV3 | Danijar Hafner | ~200M | RSSM | 观测+动作 | 通用强化学习世界模型 |
| ADriver-I | 商汤 | ~2B | 自回归 | 多视角图像 | 多摄像头一致性 |

---

## 6. 视频生成与驾驶仿真

### 6.1 视频生成模型作为世界模拟器

2024 年初，OpenAI 发布 Sora 时提出了一个深刻的观点："视频生成模型是通往世界模拟器的有前途的道路。"这一观点在自动驾驶领域引发了广泛共鸣——如果视频生成模型能够学习到物理世界的运动规律，那么它就可以作为驾驶仿真器使用。

自动驾驶的视频生成世界模型需要满足以下特殊要求：

1. **三维一致性**：多视角生成的视频必须在三维空间中保持几何一致
2. **物理合理性**：车辆运动必须符合物理定律（如运动学约束、碰撞检测）
3. **动作可控性**：能够根据自车动作条件生成对应的未来视频
4. **时序连贯性**：长时间生成不应出现突变或漂移

### 6.2 代表性视频生成驾驶模型

**Vista（2024）**：

Vista 由 MIT 团队提出，是首个能够在真实世界驾驶环境中进行闭环仿真的视频生成世界模型：

- 基于潜在扩散模型，在 DDPM 框架下生成未来驾驶视频
- 支持高分辨率（1600x900）长时间（> 100 帧）生成
- 关键创新：引入**动态先验网络**，显式建模车辆运动学约束

**MagicDrive（2024）**：

MagicDrive 专注于多视角、可控的驾驶视频生成：

- 支持6路环视摄像头同步视频生成
- 条件控制包括：3D 边界框布局、BEV 地图、文本描述
- 可精确控制场景中车辆和行人的位置、类型和运动轨迹

**DriveWM（2024）**：

DriveWM 将世界模型与多视角一致性显式结合：

$$\mathcal{L} = \mathcal{L}_\text{recon} + \lambda_\text{mv}\mathcal{L}_\text{multi-view} + \lambda_\text{temp}\mathcal{L}_\text{temporal}$$

其中 $\mathcal{L}_\text{multi-view}$ 约束不同视角之间的几何一致性，$\mathcal{L}_\text{temporal}$ 约束相邻帧之间的时序连贯性。

### 6.3 生成训练数据

世界模型生成的合成数据可以有效扩充训练集，尤其是覆盖真实数据中稀缺的长尾场景：

**数据增强流程**：

```
真实驾驶数据 → 世界模型编码 → 潜在空间 → 条件修改 → 解码生成
                                        ↓
                              ┌─────────────────────┐
                              │ 条件修改示例:          │
                              │ • 晴天 → 暴雨/大雾    │
                              │ • 白天 → 夜间          │
                              │ • 插入行人/骑行者      │
                              │ • 修改交通密度          │
                              │ • 生成事故场景          │
                              └─────────────────────┘
```

$$o_\text{aug} = \text{Decoder}\left(f_\theta(z_\text{real}, c_\text{new})\right), \quad c_\text{new} \in \{\text{rain}, \text{night}, \text{fog}, \text{accident}, \ldots\}$$

### 6.4 闭环仿真

传统自动驾驶仿真（如 CARLA）依赖手工构建的三维场景和规则驱动的交通参与者行为，在场景多样性和交通行为真实性上存在不足。基于世界模型的闭环仿真通过学习真实数据中的场景分布和交通动态，实现更逼真的仿真环境：

$$\text{闭环仿真循环}: \quad o_t \xrightarrow{\text{规划}} a_t \xrightarrow{\text{世界模型}} o_{t+1} \xrightarrow{\text{规划}} a_{t+1} \rightarrow \cdots$$

在每个时间步，规划模块基于世界模型生成的观测做出决策，决策的结果又反馈给世界模型生成下一步的观测。这种闭环交互使得仿真能够评估自动驾驶系统在连续决策场景中的表现，而非仅评估单帧预测精度。

---

## 7. 世界模型与规划的融合

### 7.1 基于模型的规划（Model-Based Planning）

世界模型使自动驾驶从"反应式规划"（基于当前观测做决策）转向**"想象式规划"**（在内部模拟中评估多种候选动作后选择最优）。

**想象式规划的核心流程**：

1. **状态编码**：将当前传感器观测编码为潜在状态 $z_0$
2. **想象展开**：对每个候选动作序列 $\{a_0, a_1, \ldots, a_{H-1}\}$，在世界模型中递归展开未来状态 $\{z_1, z_2, \ldots, z_H\}$
3. **轨迹评估**：对每条想象轨迹计算累积回报（安全性、效率、舒适性）
4. **动作选择**：选择累积回报最高的动作序列

$$a_{0:H-1}^* = \arg\max_{a_{0:H-1}} \sum_{t=0}^{H-1} \gamma^t R(z_t, a_t), \quad z_{t+1} = f_\theta(z_t, a_t)$$

其中 $R(z_t, a_t)$ 为奖励函数，$\gamma \in (0, 1]$ 为折扣因子，$H$ 为规划视野。

### 7.2 潜在空间中的树搜索

在简单场景中，可以通过采样若干候选动作序列并选择最优的来进行规划。但在复杂场景（如多车交互路口）中，动作空间的组合爆炸要求更高效的搜索策略。

**蒙特卡洛树搜索（MCTS）在潜在空间中的应用**：

```
当前潜在状态 z_0
         │
    ┌────┼────┐
    ↓    ↓    ↓
  左转  直行  右转    ← 动作分支
    │    │    │
    ↓    ↓    ↓
  z_1^L  z_1^S  z_1^R  ← 世界模型预测
    │    │    │
  ┌─┼─┐ ...  ...     ← 继续展开
  ↓ ↓ ↓
  ...              ← 叶节点评估 V(z)
```

每次迭代包含四步：

1. **选择（Selection）**：从根节点沿 UCB（Upper Confidence Bound）策略选择路径
2. **扩展（Expansion）**：在世界模型中执行动作，生成新的潜在状态节点
3. **评估（Evaluation）**：使用价值网络 $V_\psi(z)$ 评估叶节点价值
4. **回溯（Backpropagation）**：将叶节点价值沿路径回溯更新

### 7.3 安全验证与世界模型展开

世界模型可以用于规划阶段的**安全性验证**：在执行动作之前，先在世界模型中模拟其后果，检查是否会导致碰撞或违反交通规则。

**基于世界模型的安全检查流程**：

$$\text{safe}(a) = \begin{cases} \text{True} & \text{if } \forall t \in [1, H]: P(\text{collision} | z_t) < \epsilon \\ \text{False} & \text{otherwise} \end{cases}$$

其中 $z_t = f_\theta(z_{t-1}, a_{t-1})$ 为世界模型预测的未来状态，$P(\text{collision} | z_t)$ 为碰撞概率估计，$\epsilon$ 为安全阈值。

这种方法的优势在于可以评估"多步后的安全性"——即使当前动作安全，但如果后续会导致无法避免的碰撞，也应该提前规避。

### 7.4 不确定性感知规划

世界模型的预测本质上是不确定的，尤其是长时间展开后不确定性会累积放大。**不确定性感知规划**将预测的不确定性纳入决策过程：

$$a^* = \arg\max_a \left[\mathbb{E}_{z \sim p(z|a)}[R(z)] - \lambda \cdot \text{Var}_{z \sim p(z|a)}[R(z)]\right]$$

其中第一项鼓励选择期望回报高的动作，第二项通过风险厌恶系数 $\lambda$ 惩罚高方差（高不确定性）的动作。在自动驾驶中，高不确定性通常对应于预测模糊的场景（如遮挡后的行人意图），此时保守的决策（如减速）更为安全。

---

## 8. 挑战与展望

### 8.1 当前核心挑战

**分布外漂移（Distributional Shift）**

世界模型在训练数据覆盖的场景中表现良好，但在分布外（OOD）场景中可能产生完全不合理的预测。自回归生成模型尤其容易出现**误差累积**：早期帧的微小偏差在长时间展开后被放大为严重的幻觉。

$$\text{误差累积}: \quad \epsilon_T \leq \sum_{t=1}^{T} \epsilon_t + \sum_{t=1}^{T} \sum_{s=t+1}^{T} \epsilon_t \cdot L_s$$

其中 $\epsilon_t$ 为第 $t$ 步的预测误差，$L_s$ 为动力学模型的局部 Lipschitz 常数。

**幻觉问题（Hallucination）**

生成式世界模型可能产生看似逼真但物理上不合理的场景——例如生成穿越墙壁的车辆、违反运动学约束的轨迹、或凭空出现/消失的物体。这在安全关键的自动驾驶应用中是不可接受的。

**计算成本**

大规模世界模型（如 GAIA-1 的 9B 参数）在推理时的计算开销远超实时要求。即使在潜在空间中操作，每个时间步的世界模型推理 + 多候选轨迹评估仍然是巨大的计算负担。

| 挑战 | 影响 | 当前缓解策略 |
|:---:|:---:|:---:|
| 分布外漂移 | 预测偏离真实物理 | OOD 检测 + 回退到规则方法 |
| 幻觉 | 生成不合理场景 | 物理约束注入 + 后验验证 |
| 计算成本 | 无法实时部署 | 模型蒸馏 + 潜在空间压缩 |
| 评估标准缺失 | 难以量化模型质量 | FID/FVD + 闭环驾驶得分 |
| 多视角一致性 | 不同视角几何矛盾 | 3D 感知先验约束 |
| 长时连贯性 | 长视频出现漂移 | 时序注意力 + 关键帧锚定 |

### 8.2 评估指标

世界模型的评估面临独特挑战——不仅要评估生成质量，还要评估对下游驾驶任务的贡献。目前常用的指标体系包括：

**视觉质量指标**：

- **FID（Frechet Inception Distance）**：衡量生成图像的分布与真实图像分布的距离
- **FVD（Frechet Video Distance）**：FID 的视频版本，衡量视频级别的生成质量
- **LPIPS**：感知相似度指标，更贴近人眼对图像质量的判断

**场景一致性指标**：

- **3D 一致性得分**：将生成的多视角图像反投影到三维空间，评估几何一致性
- **深度估计误差**：对生成图像运行单目深度估计，与真实深度对比

**下游任务指标**：

- **闭环驾驶得分**：在世界模型仿真环境中运行规划算法，评估碰撞率、路线完成率
- **感知保真度**：对生成图像运行现有检测器，评估检测结果与真实标注的一致性

### 8.3 未来方向

**物理增强的世界模型**

将显式物理约束（如运动学方程、碰撞动力学）注入世界模型的训练和推理过程，减少幻觉生成。物理信息神经网络（PINN）的理念可以被借鉴：

$$\mathcal{L}_\text{physics} = \|\mathbf{F}(\hat{z}_{t+1}, \hat{z}_t, a_t)\|^2$$

其中 $\mathbf{F}$ 为物理约束方程（如牛顿运动定律在场景级别的表达）。

**多模态统一世界模型**

当前世界模型大多仅生成摄像头图像，未来的方向是同时生成多种传感器模态（图像、LiDAR 点云、雷达回波），构建统一的多模态世界模拟器。

**可扩展的世界模型架构**

借鉴大语言模型的扩展律（Scaling Law），探索世界模型在参数量、数据量和计算量上的扩展行为。初步研究表明，世界模型的预测质量同样随规模增长呈幂律提升：

$$\text{FVD} \propto N^{-\alpha} \cdot D^{-\beta}$$

其中 $N$ 为模型参数量，$D$ 为训练数据量。

**世界模型与基础模型的融合**

将视觉语言模型（VLM）的常识推理能力与世界模型的动力学预测能力结合，实现更高层次的场景理解和推理。例如，VLM 理解"前方是学校区域，可能有儿童冲出"，世界模型据此生成多种可能的场景演化，规划模块选择最保守的应对策略。

---

## 参考资料

1. **Mildenhall, B., et al.** "NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis." *ECCV 2020*. [arXiv:2003.08934](https://arxiv.org/abs/2003.08934)

2. **Kerbl, B., et al.** "3D Gaussian Splatting for Real-Time Radiance Field Rendering." *SIGGRAPH 2023*. [项目主页: repo-sam.inria.fr/fungraph/3d-gaussian-splatting]

3. **Tancik, M., et al.** "Block-NeRF: Scalable Large Scene Neural View Synthesis." *CVPR 2022*. [arXiv:2202.05263](https://arxiv.org/abs/2202.05263)

4. **Hu, A., et al.** "GAIA-1: A Generative World Model for Autonomous Driving." *Wayve Technical Report, 2023*. [arXiv:2309.17080](https://arxiv.org/abs/2309.17080)

5. **Wang, W., et al.** "DriveDreamer: Towards Real-world-driven World Models for Autonomous Driving." *ECCV 2024*. [arXiv:2309.09777](https://arxiv.org/abs/2309.09777)

6. **Zheng, Z., et al.** "GenAD: Generalized End-to-End Autonomous Driving via Latent World Model." *CVPR 2024*.

7. **Yan, J., et al.** "Street Gaussians for Modeling Dynamic Urban Scenes." *ECCV 2024*. [arXiv:2401.01339](https://arxiv.org/abs/2401.01339)

8. **Zhou, X., et al.** "DrivingGaussian: Composite Gaussian Splatting for Surrounding Dynamic Autonomous Driving Scenes." *CVPR 2024*. [arXiv:2312.07920](https://arxiv.org/abs/2312.07920)

9. **Hafner, D., et al.** "Mastering Diverse Domains through World Models (DreamerV3)." *arXiv:2301.04104, 2023*.

10. **Gao, Y., et al.** "Vista: A Generalizable Driving World Model with High Fidelity and Versatile Controllability." *NeurIPS 2024*.

11. **Yang, D., et al.** "UniSim: A Neural Closed-Loop Sensor Simulator." *CVPR 2023*. [arXiv:2308.01898](https://arxiv.org/abs/2308.01898)

12. **Remez, T., et al.** "Urban Radiance Fields." *CVPR 2022*.

13. **Gao, R., et al.** "MagicDrive: Street View Generation with Diverse 3D Geometry Control." *ICLR 2024*. [arXiv:2310.02601](https://arxiv.org/abs/2310.02601)

14. **Huang, Y., et al.** "GaussianFormer: Scene as Gaussians for Vision-Based 3D Semantic Occupancy Prediction." *ECCV 2024*.

15. **Wang, Y., et al.** "Driving into the Future: Multiview Visual Forecasting and Planning with World Model for Autonomous Driving (DriveWM)." *CVPR 2024*.
