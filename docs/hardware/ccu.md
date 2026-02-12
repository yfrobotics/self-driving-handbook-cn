# 中控单元 (AI芯片, GPGPU)

自动驾驶系统需要强大的计算平台来实时处理传感器数据并运行感知、规划和控制算法。中控单元 (Central Computing Unit, CCU) 是车载计算的核心，其算力、功耗和可靠性直接决定了自动驾驶的能力上限。


## 计算架构

自动驾驶计算平台采用异构计算架构，常见处理单元类型包括：

- **CPU**：通用处理器，负责系统调度、逻辑控制和非实时任务
- **GPU/GPGPU**：图形处理器，大规模并行计算能力适合深度学习推理和点云处理
- **FPGA**：现场可编程门阵列，低延迟、可定制，适合传感器数据预处理
- **ASIC/NPU**：定制 AI 加速芯片，能效比最高，如 Tesla FSD 芯片中的 NPU
- **SoC**：系统级芯片，将 CPU、GPU、NPU 集成于单芯片，如 NVIDIA Orin


## 主流平台对比

| 平台 | 厂商 | AI 算力 | 功耗 | 特点 |
| --- | --- | --- | --- | --- |
| DRIVE Orin | NVIDIA | 254 TOPS | 45 W | CUDA 生态，支持多芯片级联 |
| DRIVE Thor | NVIDIA | 2000 TOPS | 未公布 | 下一代集中式平台 |
| EyeQ6 | Mobileye | 34 TOPS | 12 W | 低功耗，适合 L2+/L3 |
| FSD Chip (HW3) | Tesla | 144 TOPS | 72 W | 自研 NPU，双芯冗余设计 |
| HW4 (AI5) | Tesla | ~300 TOPS | ~100 W | 更强算力，支持更高分辨率 |
| MDC 810 | 华为 | 400+ TOPS | 100 W | 昇腾 AI 核心，支持 L4 |
| 征程 5 | 地平线 | 128 TOPS | 30 W | BPU 架构，面向国内主机厂 |


## 关键性能指标

- **TOPS (Tera Operations Per Second)**：衡量 AI 算力的核心指标，数值越高处理能力越强
- **TDP (热设计功耗)**：芯片最大散热需求，直接影响车辆热管理设计
- **推理延迟**：从传感器输入到决策输出的端到端延迟，通常要求 < 100 ms
- **车规认证**：芯片需通过 AEC-Q100 可靠性认证和 ISO 26262 功能安全认证（ASIL-B/D）


## 软件生态

硬件算力需要配合成熟的软件工具链才能发挥作用：

- **CUDA / cuDNN**：NVIDIA GPU 并行计算框架和深度学习库
- **TensorRT**：NVIDIA 推理优化引擎，支持模型量化和层融合
- **AUTOSAR (Adaptive)**：汽车开放系统架构，提供标准化中间件
- **ROS 2**：机器人操作系统，广泛用于自动驾驶原型开发
- **OpenVINO / MindSpore**：分别对应 Intel 和华为生态的推理框架


## 参考资料

1. NVIDIA. DRIVE AGX Platform Documentation.
2. Tesla. Autonomy Day / AI Day Technical Presentations, 2019–2023.
3. 地平线. 征程系列芯片白皮书.
