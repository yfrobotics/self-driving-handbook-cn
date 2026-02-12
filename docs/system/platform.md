# 设计与仿真平台

仿真平台在自动驾驶开发中扮演着关键角色。由于真实路测成本高、危险场景难以复现，仿真系统可以在虚拟环境中高效验证感知、规划和控制算法，加速开发迭代。业界普遍认为自动驾驶系统需要数十亿公里的验证里程，仿真是实现这一目标的唯一可行途径。


## 开发与仿真平台

| 平台 | 类型 | 描述 |
| --- | --- | --- |
| [Autoware](https://www.autoware.org/) | 开源软件栈 | 基于 ROS 的全栈自动驾驶平台，支持感知、规划、控制 |
| [Apollo](https://github.com/ApolloAuto/apollo) | 开源软件栈 | 百度无人驾驶平台，包含完整工具链和云服务 |
| [CARLA](http://carla.org/) | 开源仿真器 | 基于 Unreal Engine，支持多传感器仿真和场景编辑 |
| [AirSim](https://github.com/microsoft/AirSim) | 开源仿真器 | 微软开源，支持无人机和车辆仿真，集成深度学习 |
| [LGSVL Simulator](https://www.lgsvlsimulator.com/) | 开源仿真器 | 高保真传感器仿真，与 Apollo 和 Autoware 深度集成 |
| MATLAB - Autonomous Vehicle Toolbox | 商业工具 | MATLAB 机器人工具箱，提供算法开发和可视化 (需付费) |
| [SUMO](https://eclipse.dev/sumo/) | 开源交通仿真 | 微观交通流仿真器，适合大规模交通场景研究 |
| [NVIDIA DRIVE Sim](https://developer.nvidia.com/drive) | 商业仿真器 | 基于 Omniverse，物理级传感器仿真，支持大规模并行 |
| PreScan (Siemens) | 商业仿真器 | 面向 ADAS 和 V2X 测试，丰富的传感器和场景库 |


## 仿真核心能力

### 传感器仿真
通过光线追踪和物理引擎模拟摄像头、LiDAR、毫米波雷达等传感器的输出，包括天气（雨雾雪）和光照变化对传感器的影响。

### 场景生成
- **数据驱动**：从真实采集数据中重建场景
- **规则生成**：基于参数化规则批量创建测试场景
- **对抗生成**：自动搜索导致系统失败的极端场景 (Corner Case)

### 车辆动力学
仿真车辆的加速、制动、转向等物理特性，常用模型包括单车运动学模型、自行车模型和多体动力学模型。

### 交通流仿真
生成逼真的背景交通，包括其他车辆、行人、非机动车的行为模型，支持人-车交互场景。


## 参考资料

1. A. Dosovitskiy et al. CARLA: An Open Urban Driving Simulator. CoRL, 2017.
2. S. Shah et al. AirSim: High-Fidelity Visual and Physical Simulation for Autonomous Vehicles. FSR, 2017.
3. NVIDIA. DRIVE Sim Documentation.
