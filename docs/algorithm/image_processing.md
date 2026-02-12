# 图像识别与分割

视觉感知是自动驾驶系统的核心能力之一。通过摄像头获取的图像数据，系统需要完成目标检测、语义分割和车道线识别等任务，为下游的规划与决策提供环境理解。


## 核心任务

| 任务 | 输入 | 输出 | 典型应用 |
| --- | --- | --- | --- |
| 目标检测 (Object Detection) | 图像 | 2D 边界框 + 类别 | 车辆、行人、交通标志检测 |
| 语义分割 (Semantic Segmentation) | 图像 | 逐像素类别标签 | 可行驶区域、道路边界识别 |
| 实例分割 (Instance Segmentation) | 图像 | 逐像素类别 + 实例 ID | 区分同类别不同个体 |
| 车道线检测 (Lane Detection) | 图像 | 车道线参数或掩码 | 车道保持、变道辅助 |
| 深度估计 (Depth Estimation) | 单目/双目图像 | 逐像素深度图 | 距离感知 |


## 传统方法

在深度学习兴起之前，视觉感知主要依赖手工特征：

- **HOG + SVM**：方向梯度直方图特征配合支持向量机，用于行人检测（Dalal & Triggs, 2005）
- **Haar + AdaBoost**：级联分类器，早期用于人脸和车辆检测
- **Hough 变换**：经典的车道线检测方法，在边缘图上检测直线或曲线
- **光流法 (Optical Flow)**：基于像素运动估计，用于运动目标检测

传统方法计算量小但泛化能力有限，在复杂场景下表现不佳。


## 深度学习方法

### 目标检测

- **两阶段检测器**：Faster R-CNN 系列，先生成候选区域再分类，精度高但速度较慢
- **单阶段检测器**：YOLO 系列 (YOLOv5–YOLOv8)、SSD，直接回归边界框，实时性好
- **Transformer 检测器**：DETR 及其变体，端到端检测，无需 NMS (Non-Maximum Suppression) 后处理

### 语义分割

- **FCN (全卷积网络)**：开创性工作，将分类网络改为逐像素预测
- **DeepLab 系列**：空洞卷积 + CRF / ASPP，捕获多尺度上下文
- **SegFormer**：轻量 Transformer 分割模型，适合车载部署

### 车道线检测

- **基于分割**：将车道线视为语义分割任务
- **基于关键点**：检测车道线上的关键点并拟合曲线
- **基于锚线**：LaneATT 等方法，使用预定义锚线进行回归


## 自动驾驶中的挑战

- **实时性**：车载平台需在 30–50 ms 内完成推理，要求模型量化和优化
- **恶劣天气**：雨雾、强光、夜间等条件下图像质量下降，需数据增强和域适应
- **长尾问题**：罕见物体（施工标志、动物、异形车辆）训练样本不足
- **BEV 感知**：将多相机 2D 图像统一到鸟瞰视角 (Bird's Eye View)，代表工作有 BEVFormer、BEVDet


## 参考资料

1. S. Ren et al. Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks. NeurIPS, 2015.
2. L.-C. Chen et al. DeepLab: Semantic Image Segmentation with Deep Convolutional Nets and Fully Connected CRFs. TPAMI, 2018.
3. J. Redmon et al. You Only Look Once: Unified, Real-Time Object Detection. CVPR, 2016.
