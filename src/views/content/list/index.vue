<template>
  <div class="content-list-container">
    <div class="page-header">
      <h2>内容列表</h2>
      <p>这里是内容列表页面，admin和editor角色都可以访问</p>
    </div>

    <el-card>
      <el-table :data="contentList" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="标题"></el-table-column>
        <el-table-column prop="category" label="分类"></el-table-column>
        <el-table-column prop="author" label="作者"></el-table-column>
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
  name: 'ContentList',
  data () {
    return {
      contentList: [
        {
          id: 1,
          title: '第一篇文章',
          category: '技术',
          author: '张三',
          createTime: '2024-01-01'
        },
        {
          id: 2,
          title: '第二篇文章',
          category: '生活',
          author: '李四',
          createTime: '2024-01-02'
        }
      ]
    }
  }
}
</script>

<style scoped>
.content-list-container {
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
