<template>
    <div class="order-list-container">
      <div class="page-header">
        <h2>订单列表</h2>
        <p>订单管理页面</p>
      </div>
  
      <el-card>
        <el-table :data="orderList" border style="width: 100%">
          <el-table-column prop="id" label="订单ID" width="120"></el-table-column>
          <el-table-column prop="customerName" label="客户名称"></el-table-column>
          <el-table-column prop="amount" label="金额"></el-table-column>
          <el-table-column prop="status" label="状态"></el-table-column>
          <el-table-column prop="createTime" label="创建时间"></el-table-column>
          <el-table-column label="操作" width="200">
            <template>
              <el-button size="mini" type="primary">查看</el-button>
              <el-button size="mini" type="success">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script>
  export default {
    name: 'OrderList',
    data() {
      return {
        orderList: [
          {
            id: 'ORD001',
            customerName: '张三',
            amount: '￥299.00',
            status: '待处理',
            createTime: '2024-01-01 10:00:00'
          },
          {
            id: 'ORD002',
            customerName: '李四',
            amount: '￥599.00',
            status: '已完成',
            createTime: '2024-01-02 14:30:00'
          }
        ]
      }
    }
  }
  </script>
  
  <style scoped>
  .order-list-container {
    padding: 20px;
  }
  
  .page-header {
    margin-bottom: 20px;
  }
  
  .page-header h2 {
    color: #303133;
    margin-bottom: 8px;
  }
  
  .page-header p {
    color: #606266;
    margin: 0;
  }
  </style>