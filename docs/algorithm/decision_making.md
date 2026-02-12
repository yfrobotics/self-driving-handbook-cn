# 决策 (Decision Making Process)

决策系统是自动驾驶的"大脑"，决定了一个系统的性质是自动系统 (Automated Systems) 还是自主系统 (Autonomous Systems)。它根据感知和定位结果，做出驾驶行为的判断，并将指令传递给规划和控制模块。


## 层次化决策模型

自动驾驶决策通常采用三层架构：

| 层级 | 名称 | 时间尺度 | 任务 | 示例 |
| --- | --- | --- | --- | --- |
| 战略层 | 路径决策 (Route Planning) | 分钟–小时 | 全局路线选择 | 选择高速或国道 |
| 战术层 | 行为决策 (Behavioral Decision) | 秒级 | 驾驶行为选择 | 变道、跟车、超车 |
| 操作层 | 运动规划 (Motion Planning) | 毫秒级 | 轨迹生成与执行 | 具体转向和加减速 |

战术层是决策的核心，需要综合交通规则、周围车辆意图和安全约束来选择合适的驾驶行为。


## 决策方法

### 有限状态机 (FSM)
将驾驶行为建模为有限个状态（巡航、跟车、变道、停车等）及其转移条件。实现简单、可解释性强，但难以处理复杂交互场景。

### 决策树与规则系统
基于 if-then 规则的层次化判断。优点是透明可审计，缺点是规则数量随场景复杂度指数增长。

### MDP/POMDP
- **MDP (马尔可夫决策过程)**：将决策建模为状态-动作-奖励的序贯决策问题
- **POMDP (部分可观测 MDP)**：考虑传感器观测不完整性，更贴近真实驾驶场景

### 强化学习 (Reinforcement Learning)
智能体通过与环境交互学习最优策略。深度强化学习（DQN、PPO、SAC）可处理高维状态空间，但存在安全性和可解释性挑战。

### 博弈论 (Game Theory)
将多车交互建模为博弈，如纳什均衡、Stackelberg 博弈，适合处理合流、交叉路口等竞争场景。


## 典型场景决策

| 场景 | 决策要素 | 难点 |
| --- | --- | --- |
| 高速跟车 | 车距、相对速度 | 舒适性与安全性平衡 |
| 无保护左转 | 对向来车间隙、行人 | 意图预测不确定性 |
| 环形交叉路口 | 多车博弈、让行规则 | 多智能体交互 |
| 施工区域 | 临时标志、锥桶 | 非标准道路元素 |
| 紧急避障 | 突然出现的障碍物 | 极短反应时间 |


## 安全保障

### RSS 模型
Mobileye 提出的责任敏感安全模型 (Responsibility-Sensitive Safety)，定义了数学化的安全距离公式，保证自动驾驶车辆在任何可归责事故中不承担责任。核心思想包括：

- 纵向安全距离：基于最大制动能力和响应时间计算
- 横向安全距离：确保变道和并线时的最小间距
- 路权优先级：明确定义交通参与者的通行优先权

### 安全护栏 (Safety Envelope)
在决策模块输出后增加安全校验层，确保规划的轨迹不违反物理约束和安全规则，类似于 NVIDIA 的 Safety Force Field。


## 参考资料

1. S. Shalev-Shwartz, S. Shammah, and A. Shashua. On a Formal Model of Safe and Scalable Self-driving Cars. arXiv:1708.06374, 2017.
2. S. Ulbrich et al. Defining and Substantiating the Terms Scene, Situation, and Scenario. IEEE ITSC, 2015.
3. D. Silver et al. Mastering the Game of Go with Deep Neural Networks and Tree Search. Nature, 2016.
