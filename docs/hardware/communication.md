# 车内总线

车载通信总线负责连接各电子控制单元 (ECU)，是自动驾驶车辆神经系统的基础。随着自动驾驶等级提升，车内数据量急剧增长，总线架构也在从传统分布式向集中式演进。


## 传统总线协议

| 协议 | 速率 | 拓扑 | 特点 | 典型应用 |
| --- | --- | --- | --- | --- |
| CAN 2.0 | 1 Mbps | 总线型 | 可靠性高，报文优先级仲裁 | 动力、底盘控制 |
| LIN | 20 kbps | 主从式 | 成本极低，单线通信 | 车窗、座椅等低速控制 |
| FlexRay | 10 Mbps | 双通道 | 确定性调度，支持冗余 | 线控转向、主动悬架 |
| MOST | 25–150 Mbps | 环形 | 面向多媒体数据流 | 车载娱乐系统 |


## 新一代总线技术

传统 CAN 带宽已无法满足自动驾驶数据需求（摄像头、LiDAR 每秒产生数 GB 数据），新一代车载网络应运而生：

- **CAN FD (Flexible Data-rate)**：兼容 CAN 2.0，数据段速率提升至 8 Mbps，单帧载荷从 8 字节扩展到 64 字节
- **CAN XL**：下一代演进，速率可达 10+ Mbps，帧载荷 2048 字节
- **车载以太网 (Automotive Ethernet)**：
  - 100BASE-T1 (BroadR-Reach)：100 Mbps 单对线缆传输
  - 1000BASE-T1：1 Gbps，满足传感器原始数据传输
  - 10GBASE-T1：面向 L4/L5 级大规模数据交换
- **TSN (时间敏感网络)**：基于以太网的确定性实时通信标准，保障关键数据低延迟传输


## 架构演进

自动驾驶推动车载电子架构从分布式向集中式转变：

### 分布式架构
每个功能对应独立 ECU，通过 CAN 总线互联。优点是模块化，缺点是线束复杂、升级困难。

### 域集中架构
按功能域（动力域、底盘域、座舱域、自动驾驶域、车身域）划分域控制器 (DCU, Domain Control Unit)，减少 ECU 数量。

### 区域架构
按车辆物理区域划分区域网关 (Zone Gateway)，搭配中央计算平台，大幅简化线束。

### 中央计算架构
单一或少量高性能中央计算单元处理大部分逻辑，区域控制器仅负责 I/O 接口。这是 L4/L5 自动驾驶的目标架构，代表方案包括 Tesla 和大众 E/E 架构。


## 参考资料

1. CAN in Automation (CiA). CAN FD Specification.
2. IEEE 802.3 Ethernet Working Group. Automotive Ethernet Standards.
3. R. Zurawski. Automotive Ethernet. Cambridge University Press, 2020.
