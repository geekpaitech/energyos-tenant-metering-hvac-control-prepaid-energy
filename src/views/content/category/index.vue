<template>
  <div class="content-category-container">
    <div class="page-header">
      <h2>分类管理</h2>
      <p>这里是分类管理页面，admin和editor角色都可以访问</p>
    </div>

    <el-card>
      <div slot="header" class="clearfix">
        <span>分类列表</span>
        <el-button style="float: right; padding: 3px 0" type="text">添加分类</el-button>
      </div>

      <el-table :data="categoryList" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="name" label="分类名称"></el-table-column>
        <el-table-column prop="description" label="描述"></el-table-column>
        <el-table-column prop="createTime" label="创建时间"></el-table-column>
        <el-table-column label="操作" width="200">
          <template>
            <el-button size="mini" type="primary">编辑</el-button>
            <el-button size="mini" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ContentCategory',
  data () {
    return {
      categoryList: [
        {
          id: 1,
          name: '技术',
          description: '技术相关文章',
          createTime: '2024-01-01'
        },
        {
          id: 2,
          name: '生活',
          description: '生活相关文章',
          createTime: '2024-01-02'
        }
      ]
    }
  }
}
</script>

<style scoped>
.content-category-container {
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

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}
</style>
