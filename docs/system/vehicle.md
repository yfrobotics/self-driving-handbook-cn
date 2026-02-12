# 自动驾驶车辆

自动驾驶车辆是一个高度集成的复杂系统，涵盖感知、决策、执行和基础设施四个层面。各组件协同工作，形成从环境感知到车辆控制的完整闭环。


## 系统架构

### 感知层
负责获取和理解环境信息：

- **传感器 (Sensors)**：摄像头、LiDAR、毫米波雷达、超声波等，提供多模态环境数据。详见[感知传感器](../hardware/sensors.md)
- **V2X 通信接口 (V2X Communication Interface)**：接收交通信号灯、周围车辆等信息。详见[智能交通](v2x.md)
- **感知 (Perception)**：对传感器数据进行目标检测、语义分割和跟踪。详见[图像识别与分割](../algorithm/image_processing.md)和[激光点云数据处理](../algorithm/laser_processing.md)

### 决策层
基于感知结果做出驾驶决策：

- **道路-世界模型 (Road-World Model)**：融合多源信息构建统一的环境表征，包括静态地图和动态目标
- **行为规划 (Behaviour Planning)**：选择驾驶行为（跟车、变道、超车等）。详见[决策](../algorithm/decision_making.md)
- **路径规划 (Path Planning)**：生成安全可行的行驶轨迹。详见[路径规划](../algorithm/path_planning.md)

### 执行层
将决策转化为车辆物理运动：

- **车辆线控系统 (Vehicle By-Wire Control)**：通过线控转向、制动和油门执行控制指令。详见[线控系统](../hardware/drive_by_wire.md)
- **短期路径规划 (Short-Term Path Planning)**：将规划轨迹转化为具体的转向角、油门和制动控制量

### 基础设施层
支撑系统持续可靠运行：

- **嵌入式计算平台 (Embedded Computing Platform)**：提供实时计算能力。详见[中控单元](../hardware/ccu.md)
- **状态监测 (Health Monitoring)**：实时监控各子系统工作状态，检测传感器失效和系统异常
- **数据记录单元 (Data Logger)**：记录传感器原始数据和系统日志，用于事故回溯和算法迭代
- **用户交互界面 (User Interface)**：向驾驶员展示系统状态，接收人机交互指令。详见[自然语言识别与交互](../algorithm/nlp.md)


## 数据流

自动驾驶系统的数据流形成一个感知-决策-执行的闭环：

1. **传感器采集**：摄像头、LiDAR、雷达以 10–60 Hz 频率持续采集原始数据
2. **感知融合**：多传感器数据经过时间同步和空间标定后，融合生成统一的环境模型
3. **行为决策**：结合定位信息、交通规则和预测结果，选择当前最优驾驶行为
4. **轨迹规划**：生成满足安全、舒适和可行性约束的轨迹
5. **控制执行**：将轨迹跟踪为具体的转向、油门和制动指令，通过线控系统作用于车辆
6. **反馈更新**：车辆状态（速度、位姿）反馈至感知和规划模块，形成闭环

整个闭环的端到端延迟通常要求控制在 100–200 ms 以内，以保证安全的实时响应能力。


## 参考资料

1. S. Pendleton et al. Perception, Planning, Control, and Coordination for Autonomous Vehicles. Machines, 2017.
2. A. Bhat, S. Aoki and R. Rajkumar. Tools and Methodologies for Autonomous Driving Systems. Proceedings of the IEEE, 2018.
