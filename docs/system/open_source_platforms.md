# 开源平台与生态

自动驾驶技术的快速发展离不开开源社区的推动力量。从百度 Apollo 到 Autoware，从 comma.ai 的 openpilot 到 ROS2 中间件生态，开源项目已经覆盖了自动驾驶全栈——感知、规划、控制、仿真、数据标注乃至完整的量产级软件框架。本页系统梳理主流开源自动驾驶平台的架构设计、技术特点和适用场景，并为不同阶段的团队提供选型参考。

---

## 1. 开篇介绍

### 1.1 为什么开源对自动驾驶至关重要

自动驾驶是一项系统工程，涉及传感器融合、实时操作系统、高精地图、仿真验证等数十个技术子领域。任何一家公司试图独立覆盖全栈，都将面临巨大的人力、资金和时间成本。开源模式从根本上改变了这一局面，其核心价值体现在以下四个方面：

- **降低准入门槛**：高校实验室或初创团队无需从零构建完整的软件栈，即可基于成熟的开源框架快速启动自动驾驶研究或产品原型开发。
- **加速研发迭代**：社区贡献的代码、预训练模型和工具链使得研发团队可以将精力集中在核心创新而非基础设施搭建上。
- **社区验证与透明度**：开源代码接受全球开发者的审阅和测试，安全漏洞和算法缺陷更容易被发现和修复，这一点对安全关键系统尤为重要。
- **避免供应商锁定**：基于开放标准和开源框架构建的系统，具有更强的可移植性和供应商选择灵活性，降低了商业风险。

### 1.2 开源自动驾驶简史

开源自动驾驶的历史可以追溯到 **ROS（Robot Operating System）** 的诞生。2007 年 Willow Garage 发布 ROS，为机器人和自动驾驶研究提供了统一的中间件框架。2015 年，日本名古屋大学发布 **Autoware**，这是首个基于 ROS 的完整 L4 级自动驾驶软件栈。同年，百度启动 Apollo 计划的前身项目。2016 年，comma.ai 创始人 George Hotz 开源了 **openpilot**，将开源自动驾驶推向消费级市场。2017 年，百度正式发布 **Apollo 开放平台**，以"自动驾驶界的 Android"为愿景，构建了迄今规模最大的开源自动驾驶生态。

时至今日，开源自动驾驶已从学术实验走向商业落地。Apollo 驱动的 Robotaxi 已在多个中国城市商业运营，Autoware 支撑的低速接驳车在日本和欧洲投入服务，openpilot 则为数十万辆消费级汽车提供 ADAS 辅助驾驶功能。

---

## 2. Apollo（百度）

### 2.1 项目定位与发展历程

**Apollo** 是百度于 2017 年发布的开源自动驾驶平台，目标是提供一套完整的、可量产的自动驾驶解决方案。截至目前，Apollo 已迭代至 9.0 版本，GitHub 星标数超过 25,000，是全球社区规模最大的开源自动驾驶项目之一。

Apollo 的核心设计理念是**模块化与可扩展性**：每个功能模块（感知、预测、规划、控制等）都以独立组件的形式存在，可以单独替换或升级，而不影响其他模块。

### 2.2 Cyber RT 通信框架

Apollo 并未直接采用 ROS/ROS2，而是自研了 **Cyber RT** 实时通信框架。Cyber RT 的设计目标是满足自动驾驶对低延迟、高吞吐和确定性调度的严格要求。

**Cyber RT 核心特性：**

| 特性 | 说明 |
|:---:|:---:|
| 通信模型 | 发布-订阅（Pub-Sub）+ 服务（Service）|
| 序列化 | Protocol Buffers（Protobuf）|
| 调度 | 协程（Coroutine）+ CFS 调度器，支持优先级配置 |
| 实时性 | 用户态调度，避免内核态切换开销 |
| 数据录制 | 内置 Cyber Recorder，功能类似 rosbag |
| 跨平台 | 主要支持 Linux x86_64 和 aarch64 |

Cyber RT 通过**组件（Component）** 抽象将算法逻辑封装为可独立调度的执行单元。每个 Component 声明其输入/输出通道（Channel），Cyber RT 调度器根据数据依赖关系和优先级自动编排执行顺序。

```cpp
// Cyber RT 组件定义示例
class ObstacleDetectionComponent : public cyber::Component<PointCloud> {
 public:
  bool Init() override;
  bool Proc(const std::shared_ptr<PointCloud>& point_cloud) override;
};
```

### 2.3 核心功能模块

Apollo 的软件栈按功能划分为以下核心模块：

**感知模块（Perception）：**

- 基于 LiDAR 的 3D 目标检测（PointPillars、CenterPoint）
- 基于摄像头的 2D/3D 检测与语义分割
- 多传感器融合（Late Fusion 架构）
- 交通信号灯识别
- 车道线检测

**预测模块（Prediction）：**

- 基于语义地图的多模态轨迹预测
- 交互式预测（考虑自车意图对他车行为的影响）
- 输出：每个障碍物的多条候选轨迹及其概率

**规划模块（Planning）：**

Apollo 的规划采用基于场景（Scenario-Based）的架构，不同驾驶场景（如跟车、变道、路口通行、泊车）由不同的 **Task** 管线处理。核心规划算法包括：

- **EM Planner**：基于 Expectation-Maximization 思想的路径-速度解耦规划器
- **Lattice Planner**：基于采样的格栅规划器，适用于结构化道路
- **Public Road Planner**：面向城市复杂路口的规划器

规划器输出一条包含位置、速度、加速度、曲率的时序轨迹，供控制模块追踪。

**控制模块（Control）：**

- 横向控制：LQR（线性二次调节器）
- 纵向控制：PID + 前馈
- MPC（模型预测控制）可选方案
- 控制频率：100 Hz

**定位模块（Localization）：**

采用多源融合定位方案，融合 GNSS/RTK、IMU、LiDAR 点云匹配和视觉里程计，目标精度为厘米级。

### 2.4 开发工具

**Dreamview：**

Dreamview 是 Apollo 的可视化与调试平台，提供基于 Web 的图形化界面，主要功能包括：

- 实时 3D 场景渲染（自车、障碍物、规划轨迹、高精地图）
- 模块状态监控与启停控制
- 数据回放与场景调试
- PnC（Planning & Control）调参面板

**Apollo Studio：**

Apollo Studio 是百度提供的云端开发环境，支持场景编辑、仿真测试和模型训练，降低了本地环境配置的复杂度。

### 2.5 部署模型

Apollo 支持两种主要部署方式：

- **Docker 容器化部署**：官方推荐方式，通过预构建的 Docker 镜像封装全部依赖，简化环境配置
- **裸机部署**：面向量产场景，在 NVIDIA DRIVE Orin 等嵌入式平台上直接部署

### 2.6 优势与局限

| 维度 | 优势 | 局限 |
|:---:|:---:|:---:|
| 功能完整度 | 覆盖全栈（感知-预测-规划-控制-地图-仿真）| 系统复杂度高，学习曲线陡峭 |
| 生态规模 | 社区庞大，中文文档丰富 | 对中国以外硬件/传感器的支持较弱 |
| 量产验证 | 已在 Robotaxi 商业运营中验证 | 非百度生态内的定制化需求支持有限 |
| 仿真集成 | 内置仿真和云端工具 | 对第三方仿真器（CARLA等）的接口维护滞后 |

---

## 3. Autoware

### 3.1 项目演进

**Autoware** 是世界上第一个开源的 L4 级自动驾驶软件栈，由日本名古屋大学加藤真平教授团队于 2015 年发布。Autoware 的发展经历了两个重要阶段：

- **Autoware.AI**：基于 ROS 1 构建的初代版本，以快速原型验证为目标。由于 ROS 1 缺乏实时性和安全性保证，Autoware.AI 逐渐转入维护状态。
- **Autoware.Universe / Autoware Core**：基于 ROS 2 完全重写的新一代架构，由 **Autoware Foundation**（成员包括 Tier IV、ARM、NVIDIA、红帽等）主导开发。Autoware.Universe 是当前活跃开发的主线版本。

### 3.2 基于 ROS 2 的架构

Autoware.Universe 全面拥抱 ROS 2 生态，利用 DDS（Data Distribution Service）实现节点间通信，具备以下架构特点：

```
Autoware 功能栈分层：
┌─────────────────────────────────────────────┐
│  System    （系统监控、诊断、模式管理）       │
├─────────────────────────────────────────────┤
│  Sensing   （传感器驱动、数据预处理）         │
├─────────────────────────────────────────────┤
│  Localization （NDT匹配、EKF融合定位）       │
├─────────────────────────────────────────────┤
│  Perception （检测、跟踪、语义理解）          │
├─────────────────────────────────────────────┤
│  Planning   （行为决策、路径规划、速度规划）   │
├─────────────────────────────────────────────┤
│  Control    （横纵向控制、车辆接口）          │
├─────────────────────────────────────────────┤
│  Vehicle    （线控接口抽象层）                │
└─────────────────────────────────────────────┘
```

### 3.3 核心模块详解

**Sensing（传感器层）：**

- LiDAR 点云预处理（去畸变、降采样、地面分割）
- 摄像头图像矫正与同步
- GNSS/IMU 数据解析

**Localization（定位层）：**

Autoware 的定位以**正态分布变换（Normal Distributions Transform，NDT）**点云匹配为核心，将实时 LiDAR 扫描与预建的 3D 点云地图进行配准。NDT 匹配的目标函数为：

$$\hat{T} = \arg\min_{T} \sum_{i} -\log \mathcal{N}(T \cdot p_i; \mu_k, \Sigma_k)$$

其中 $T$ 为待求的刚体变换矩阵，$p_i$ 为当前扫描中的点，$\mu_k$ 和 $\Sigma_k$ 分别为地图中第 $k$ 个体素的均值和协方差。

**Perception（感知层）：**

- 基于 CenterPoint 的 LiDAR 3D 目标检测
- 基于 YOLO 系列的摄像头 2D 检测
- 多目标跟踪（Multi-Object Tracking）
- 占用栅格地图生成

**Planning（规划层）：**

- 行为决策：基于有限状态机（FSM），处理车道跟随、变道、路口通行等场景
- 路径规划：基于 Frenet 坐标系的采样规划
- 速度规划：考虑交通规则约束的速度曲线优化

**Control（控制层）：**

- 横向控制：纯追踪（Pure Pursuit）或 MPC
- 纵向控制：PID 速度控制
- 车辆接口层：抽象化设计，支持多种线控平台

### 3.4 目标使用场景

Autoware 主要面向以下应用场景：

- **学术研究**：作为算法验证平台，尤其在定位和感知领域
- **低速接驳**：固定路线的自动驾驶穿梭巴士（如日本的自动驾驶公交）
- **物流配送**：园区内的自动驾驶物流车
- **Robotaxi 原型**：Tier IV 基于 Autoware 开发了 Web.Auto 商业平台

### 3.5 Apollo 与 Autoware 对比

| 维度 | Apollo | Autoware |
|:---:|:---:|:---:|
| 中间件 | Cyber RT（自研） | ROS 2 + DDS |
| 主要语言 | C++ / Python | C++ |
| 主要传感器 | LiDAR + Camera + Radar | LiDAR + Camera |
| 定位方案 | 多源融合（RTK+LiDAR+视觉） | NDT 点云匹配为主 |
| 规划架构 | 基于场景的 Task Pipeline | FSM + Frenet 规划 |
| 社区规模 | 25K+ Stars，中国为主 | 8K+ Stars，国际化 |
| 商业落地 | Robotaxi 大规模运营 | 低速接驳、物流 |
| 硬件绑定 | 倾向百度生态硬件 | 硬件无关，接口抽象 |
| 学习难度 | 高（系统庞大） | 中（ROS 2 生态文档丰富） |

---

## 4. OpenPilot（comma.ai）

### 4.1 消费级自动驾驶的开拓者

**openpilot** 是 comma.ai 公司开源的高级驾驶辅助系统（ADAS），定位于为消费者提供类似特斯拉 Autopilot 的功能体验，但以开源、低成本的方式实现。openpilot 的核心理念是：通过一个售价约 $250 的硬件设备（**comma 3X**）和开源软件，即可为已有车辆添加自适应巡航（ACC）和车道居中保持（LKA）功能。

截至目前，openpilot 支持超过 **250 款车型**（覆盖丰田、本田、现代、大众等主流品牌），社区累计行驶里程超过 **2.5 亿英里**。

### 4.2 软件架构

openpilot 的软件架构高度精简，以 Python 为主要开发语言：

```
openpilot 核心进程：
┌──────────────────────────────────────────┐
│  selfdrive                                │
│  ├── modeld    （神经网络推理）            │
│  ├── plannerd  （路径与速度规划）          │
│  ├── controlsd （横纵向控制输出）          │
│  ├── radard    （雷达数据处理）            │
│  ├── calibrationd （在线标定）             │
│  └── dmonitoringd （驾驶员监控）          │
├──────────────────────────────────────────┤
│  cereal       （消息序列化/IPC通信）       │
├──────────────────────────────────────────┤
│  panda        （CAN总线硬件接口）          │
└──────────────────────────────────────────┘
```

**关键组件说明：**

- **modeld**：运行端到端神经网络模型，输入为前视摄像头图像，直接输出车道线、前车位置和驾驶路径
- **plannerd**：根据 modeld 的输出生成纵向（速度）和横向（转向）规划
- **controlsd**：将规划输出转换为 CAN 总线指令（转向角、制动/加速扭矩）
- **cereal**：基于 Cap'n Proto 的高效序列化框架，用于进程间通信
- **panda**：comma.ai 自研的 CAN 总线适配器固件，支持安全看门狗

### 4.3 端到端学习方法

openpilot 是业界较早在量产级产品中采用**端到端学习（End-to-End Learning）**方法的系统。其核心模型 **supercombo** 接收前视摄像头的连续帧图像作为输入，直接输出：

- **驾驶路径（Path）**：未来数秒的车辆横向轨迹
- **前车概率与距离**：纵向跟车控制的关键输入
- **车道线位置**：用于车道居中
- **驾驶员注意力热图**：用于驾驶员监控

这种端到端方法避免了传统模块化架构中感知-规划之间的信息损失，但也带来了可解释性和泛化性方面的挑战。

### 4.4 社区驱动的车型支持

openpilot 的车型支持主要依赖社区贡献。每款新车型的适配需要：

1. **CAN 总线逆向工程**：解析目标车型的 CAN 数据库（DBC 文件），识别转向、制动、油门等关键信号
2. **指纹识别（Fingerprinting）**：基于 CAN 总线上的特征消息自动识别车型
3. **安全测试**：确保横纵向控制的输出范围在车辆安全工作区间内
4. **社区验证**：由多位车主在真实道路上测试并反馈

### 4.5 功能边界与局限

| 能力范围 | 局限性 |
|:---:|:---:|
| 高速公路自适应巡航 + 车道居中 | 不支持城市道路自动驾驶 |
| 自动跟车启停（部分车型） | 不支持自动变道（需驾驶员介入） |
| 驾驶员监控（DMS） | 不识别交通信号灯和标志 |
| 支持 250+ 车型 | 部分车型需硬件改装（转向扭矩限制） |
| 持续 OTA 更新 | 依赖 comma 3X 专用硬件 |

---

## 5. ROS/ROS2 生态

### 5.1 ROS 2 的定位：中间件而非完整 AD 栈

需要明确的是，**ROS 2（Robot Operating System 2）** 本身不是一套自动驾驶解决方案，而是一个通用的机器人中间件框架。它提供了节点管理、进程间通信、参数服务、生命周期管理等基础设施，使得开发者可以在此基础上构建自动驾驶应用。Autoware 就是基于 ROS 2 构建的典型范例。

### 5.2 DDS 通信机制

ROS 2 采用 **DDS（Data Distribution Service）** 作为底层通信协议，取代了 ROS 1 中基于 XML-RPC 的自定义通信方式。DDS 是 OMG（Object Management Group）制定的工业级实时数据分发标准，具有以下优势：

- **去中心化**：无需 ROS Master 中心节点，提高了系统鲁棒性
- **QoS 策略**：提供丰富的服务质量配置（可靠性、持久性、截止时间、活性检测等）
- **实时性**：支持确定性通信，可满足控制回路的时延要求
- **发现机制**：自动发现同一网络/域内的节点，无需手动配置

ROS 2 支持多种 DDS 实现（RMW 层）：

| DDS 实现 | 提供商 | 许可证 | 特点 |
|:---:|:---:|:---:|:---:|
| Fast DDS | eProsima | Apache 2.0 | ROS 2 默认实现，社区活跃 |
| Cyclone DDS | Eclipse | EPL 2.0 | 低延迟，资源占用小 |
| Connext DDS | RTI | 商业 | 工业级，航空航天/国防应用广泛 |
| GurumDDS | Gurum Networks | 商业 | 嵌入式优化 |

### 5.3 实时性能力

ROS 2 的实时性改进主要体现在：

- **实时操作系统支持**：可运行在 PREEMPT_RT 补丁的 Linux 内核上
- **内存管理**：支持预分配内存池，避免运行时动态分配引起的延迟抖动
- **执行器模型**：提供单线程、多线程和静态执行器，可根据应用需求定制调度策略
- **生命周期节点**：标准化的节点状态管理（Unconfigured → Inactive → Active → Finalized），便于系统级状态协调

然而，ROS 2 的实时性仍无法与 AUTOSAR Adaptive 或专用 RTOS 相比。在对确定性延迟要求极高的控制回路（如线控制动，要求 < 1 ms 抖动）中，通常需要绕过 ROS 2 通信层，直接在实时线程中处理。

### 5.4 关键 AD 相关功能包

ROS 2 生态中与自动驾驶密切相关的功能包包括：

- **Nav2（Navigation2）**：完整的导航框架，包含路径规划、行为树、代价地图、控制器服务器，虽然最初面向移动机器人，但其架构思想广泛应用于低速自动驾驶
- **robot_localization**：基于扩展卡尔曼滤波（EKF）或无迹卡尔曼滤波（UKF）的多传感器融合定位包，支持 GPS、IMU、轮速计等多种输入
- **pcl_ros**：点云库（Point Cloud Library）的 ROS 2 封装，提供点云滤波、分割、配准等功能
- **image_pipeline**：摄像头标定、图像矫正、深度估计等视觉处理工具链
- **tf2**：坐标变换库，管理传感器和车身之间的空间几何关系
- **rosbag2**：数据录制与回放工具，支持多种存储后端（SQLite、MCAP）

### 5.5 为什么 ROS 2 是 AD 研究的首选基础

ROS 2 在自动驾驶研究领域占据主导地位的原因可以归结为：

1. **标准化接口**：统一的消息定义和通信接口，使得不同团队开发的模块可以无缝集成
2. **工具链完善**：可视化（RViz2、Foxglove）、数据录制（rosbag2）、调试（rqt）等工具一应俱全
3. **跨平台**：支持 Linux、macOS、Windows，并可部署到 ARM 嵌入式平台
4. **学术影响力**：大量顶会论文的代码实现基于 ROS/ROS 2 发布，形成了正向循环

---

## 6. 仿真与数据工具

开源自动驾驶生态不仅包含运行时软件栈，还涵盖了丰富的仿真、可视化和数据标注工具。这些工具构成了自动驾驶开发的"基础设施层"。

### 6.1 CARLA

**CARLA（Car Learning to Act）** 是当前学术界使用最广泛的开源自动驾驶仿真器，基于虚幻引擎 4（Unreal Engine 4）构建，提供高质量的视觉渲染和物理仿真。

**核心能力：**

- **传感器仿真**：摄像头（RGB、深度、语义分割）、LiDAR（可配置线数和旋转频率）、毫米波雷达、GPS/IMU
- **场景管理**：内置 12 张城市地图，支持 OpenDRIVE 格式自定义地图导入
- **Scenario Runner**：基于 OpenSCENARIO 标准的场景自动执行工具
- **Python API**：完整的脚本化控制接口，可程序化配置天气、交通流、传感器布局
- **多智能体**：支持同时运行多辆自动驾驶车辆和大量 NPC 交通参与者

CARLA 特别适合强化学习训练、端到端模型验证和边缘场景数据合成。

### 6.2 SUMO

**SUMO（Simulation of Urban Mobility）** 是德国航空航天中心（DLR）开发的开源微观交通流仿真器。与 CARLA 侧重传感器和视觉仿真不同，SUMO 专注于**交通流建模**：

- 微观车辆运动模型（跟驰模型、换道模型）
- 交通信号灯控制逻辑仿真
- 大规模路网（数千条道路、数万辆车辆）实时仿真
- **TraCI 接口**：支持与外部程序实时交互控制仿真

SUMO 常与 CARLA 联合使用（通过 SUMO-CARLA Co-Simulation 桥接），由 SUMO 生成真实的交通流，CARLA 提供传感器级渲染，实现高保真闭环仿真。

### 6.3 可视化工具

**RViz2：**

ROS 2 生态的标准可视化工具，支持点云、目标框、路径、占用栅格、TF 坐标树等数据的三维可视化。是 Autoware 开发调试的核心工具。

**Foxglove Studio：**

新一代的机器人数据可视化平台，提供基于 Web 的图形化界面，支持实时数据和离线数据回放。相较于 RViz2，Foxglove 具有更友好的用户界面、更丰富的面板类型和跨平台兼容性，且支持 MCAP 数据格式的高效回放。

### 6.4 数据录制与回放

**rosbag2 / MCAP：**

- **rosbag2**：ROS 2 的数据录制工具，将话题（Topic）消息序列化存储，支持 SQLite 和 MCAP 存储后端
- **MCAP**：Foxglove 开发的开源数据容器格式，支持高效的随机访问、时间范围查询和多通道索引，已被广泛采用为 rosbag2 的默认后端

数据录制是自动驾驶开发闭环（路测采集 → 离线分析 → 算法改进 → 仿真验证）的关键一环。

### 6.5 数据标注工具

**CVAT（Computer Vision Annotation Tool）：**

Intel 开源的计算机视觉标注平台，支持图像和视频的 2D/3D 标注任务。核心特性包括：

- 2D 标注：矩形框、多边形、关键点、语义分割
- 3D 标注：点云中的 3D 立方体框标注
- 自动标注：集成预训练模型，支持半自动标注流程
- 多人协作：任务分配、审核机制、版本管理

**Label Studio：**

开源数据标注平台，支持图像、文本、音频、视频等多模态数据，具有灵活的标注模板定制能力。

**3D BAT（3D Bounding Box Annotation Tool）：**

专门用于 LiDAR 点云的 3D 目标标注工具，支持点云与摄像头图像的联合标注视图。

---

## 7. 开源数据集

开源数据集是自动驾驶算法训练和基准测试的基石。以下是当前最具影响力的开源数据集概览。

### 7.1 nuScenes

由 Motional（原 nuTonomy）发布，拥有完整的 360 度传感器套件（6 摄像头 + 1 LiDAR + 5 毫米波雷达）。1000 个场景，1400 万个 3D 标注框，23 类目标，是当前 3D 目标检测和多目标追踪领域最常用的基准。

### 7.2 KITTI

由德国卡尔斯鲁厄理工学院（KIT）和丰田美国研究院联合发布（2012 年），是自动驾驶领域最早也最经典的基准数据集。覆盖 3D 检测、追踪、光流、深度估计、视觉里程计等多个任务，至今仍被广泛使用。

### 7.3 Waymo Open Dataset

Waymo 发布的大规模数据集，以极高的标注质量著称。配备 5 个 LiDAR + 5 个摄像头，涵盖感知子集（1000 场景）和运动预测子集（10 万+ 场景）。

### 7.4 Argoverse 2

由 Argo AI 发布，以高精地图与场景数据的强绑定为特色，特别适合运动预测和地图相关的研究任务。提供 7 摄像头 + 2 LiDAR 的传感器配置。

### 7.5 数据集综合对比

| 数据集 | 发布年份 | 场景数 | 传感器配置 | 标注类别数 | 关键任务 | 许可证 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| KITTI | 2012 | ~15K 帧 | 2 摄 + 1 LiDAR + GPS/IMU | 3 | 检测/追踪/深度/里程计 | CC BY-NC-SA |
| nuScenes | 2020 | 1000 场景 | 6 摄 + 1 LiDAR + 5 雷达 | 23 | 检测/追踪/预测/分割 | CC BY-NC-SA |
| Waymo Open | 2019 | 1000 场景 | 5 摄 + 5 LiDAR | 4 | 检测/追踪/预测 | Waymo 专有 |
| Argoverse 2 | 2022 | 1000 场景 | 7 摄 + 2 LiDAR | 26 | 检测/预测/地图分割 | CC BY-NC-SA |
| ONCE | 2021 | 1M 帧 | 7 摄 + 1 LiDAR | 5 | 3D 检测 | 学术使用 |

**选择建议：**

- **入门学习与基准复现**：KITTI（经典、社区资源丰富）
- **3D 检测与追踪研究**：nuScenes（全向传感器、丰富标注）
- **运动预测研究**：Waymo Open Motion（最大规模场景库）
- **地图相关研究**：Argoverse 2（高精地图强绑定）
- **中国场景特化**：ONCE（中国道路场景、大规模数据）

---

## 8. 平台选型指南

### 8.1 选型决策框架

选择开源自动驾驶平台不存在"最优解"，需要根据团队的具体情况综合考量。以下是关键决策维度：

**研究 vs 产品：**

- 如果目标是**学术研究**（论文发表、算法验证），优先考虑 Autoware（ROS 2 生态、模块可替换性强）或直接基于 ROS 2 自建栈
- 如果目标是**产品落地**（Robotaxi、物流车），Apollo 提供了更完整的量产级工具链和验证体系

**算力预算：**

- **低算力**（< 10 TOPS，如 Jetson Orin Nano）：openpilot（单模型推理，资源占用低）
- **中等算力**（30–100 TOPS）：Autoware（模块化架构，可按需裁剪）
- **高算力**（100+ TOPS，如 NVIDIA DRIVE Orin）：Apollo（全栈运行需要较高算力）

**传感器配置：**

- **仅摄像头**：openpilot（纯视觉方案）
- **LiDAR + Camera**：Autoware 或 Apollo
- **全套件（LiDAR + Camera + Radar + GPS/IMU）**：Apollo

**团队规模与技术栈：**

- **1–5 人小团队**：openpilot（代码精简）或基于 ROS 2 的自定义栈
- **5–20 人中等团队**：Autoware（模块化、文档完善）
- **20+ 人大团队**：Apollo（功能全面、有中文社区支持）

### 8.2 平台综合对比

| 维度 | Apollo | Autoware | openpilot | ROS 2（自建栈） |
|:---:|:---:|:---:|:---:|:---:|
| 目标级别 | L4 | L4 | L2 | 视实现而定 |
| 中间件 | Cyber RT | ROS 2 / DDS | cereal（自研） | ROS 2 / DDS |
| 主要语言 | C++ / Python | C++ | Python / C++ | C++ / Python |
| 传感器要求 | LiDAR + Camera + Radar | LiDAR + Camera | 仅摄像头 | 灵活配置 |
| 学习曲线 | 高 | 中 | 低 | 中 |
| 社区语言 | 中文为主 | 英文 / 日文 | 英文 | 英文 |
| 商业落地 | Robotaxi（百度） | 接驳车（Tier IV） | 消费级 ADAS | 研究/原型 |
| 仿真支持 | 内置 + Apollo Studio | CARLA / LGSVL | 内置回放仿真 | CARLA / Gazebo |
| 许可证 | Apache 2.0 | Apache 2.0 | MIT | Apache 2.0 |
| 最低算力 | ~100 TOPS | ~30 TOPS | ~5 TOPS | 视模块而定 |

### 8.3 典型选型场景

**场景一：高校自动驾驶实验室**

- **推荐方案**：Autoware + CARLA 仿真 + nuScenes 数据集
- **理由**：基于 ROS 2 的标准化架构便于教学和论文复现；模块可独立替换，便于算法对比实验；CARLA 提供免费的仿真验证环境

**场景二：Robotaxi 创业公司**

- **推荐方案**：Apollo 作为起点，逐步定制化
- **理由**：Apollo 提供了从感知到控制的完整量产级框架；Dreamview 和 Apollo Studio 加速开发调试；百度生态（地图、云服务）提供额外支持

**场景三：消费级 ADAS 产品**

- **推荐方案**：openpilot 作为参考实现
- **理由**：openpilot 已在数十万辆车上验证，端到端方案的工程实现成熟；MIT 许可证允许商业使用；社区车型适配经验丰富

**场景四：特定算法研究（如运动预测）**

- **推荐方案**：基于 ROS 2 自建最小栈 + Waymo Open Motion Dataset
- **理由**：仅需构建必要的数据加载和评估管线；避免全栈框架带来的不必要复杂度；专注于算法本身的创新

### 8.4 混合使用策略

实际工程中，团队往往不会局限于单一平台，而是**混合使用**多个开源项目的组件：

- 使用 **ROS 2** 作为中间件基座
- 借鉴 **Autoware** 的定位模块（NDT 匹配）
- 参考 **Apollo** 的规划架构（场景化 Task Pipeline）
- 集成 **openpilot** 的端到端模型作为感知前端
- 使用 **CARLA** 进行仿真验证，**CVAT** 进行数据标注

这种"取各家之长"的策略在中小团队中尤为常见，也正是开源生态最大的价值所在——不同项目的模块可以像积木一样自由组合，服务于特定的工程目标。

---

## 参考资料

1. 百度 Apollo 开源平台. "Apollo: Open Source Autonomous Driving." GitHub, https://github.com/ApolloAuto/apollo.
2. The Autoware Foundation. "Autoware — Open-Source Software for Self-Driving Vehicles." https://autoware.org/.
3. comma.ai. "openpilot: An open source driver assistance system." GitHub, https://github.com/commaai/openpilot.
4. Macenski, S. et al. "Robot Operating System 2: Design, Architecture, and Uses in the Wild." *Science Robotics*, 2022.
5. Dosovitskiy, A. et al. "CARLA: An Open Urban Driving Simulator." *Conference on Robot Learning (CoRL)*, 2017.
6. Lopez, P. A. et al. "Microscopic Traffic Simulation using SUMO." *IEEE ITSC*, 2018.
7. Caesar, H. et al. "nuScenes: A multimodal dataset for autonomous driving." *CVPR*, 2020.
8. Geiger, A. et al. "Are we ready for Autonomous Driving? The KITTI Vision Benchmark Suite." *CVPR*, 2012.
9. Sun, P. et al. "Scalability in Perception for Autonomous Driving: Waymo Open Dataset." *CVPR*, 2020.
10. Wilson, B. et al. "Argoverse 2: Next Generation Datasets for Self-Driving Perception and Forecasting." *NeurIPS Datasets and Benchmarks*, 2023.
11. Kato, S. et al. "Autoware on Board: Enabling Autonomous Vehicles with Embedded Systems." *IEEE/ACM ICCPS*, 2018.
12. 百度 Cyber RT 技术文档. https://cyber-rt.readthedocs.io/.
