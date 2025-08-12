import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dbConfig from './config/db.config.js';

const app = express();
app.use(cors());
app.use(express.json());

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 样品API路由
app.route('/api/samples')
  // 获取所有样品
  .get(async (req, res) => {
      try {
        const [rows] = await pool.execute('SELECT * FROM samples WHERE is_deleted = 0');
        res.json(rows);
      } catch (err) {
      console.error('数据库错误:', err);
      res.status(500).json({ error: '获取样品列表失败' });
    }
  })
  // 创建新样品
  .post(async (req, res) => {
    try {
      // 验证请求数据
      if (!req.body.name || !req.body.time || !req.body.person || !req.body.phone) {
        return res.status(400).json({ error: '缺少必要字段' });
      }
      
      const [result] = await pool.execute(
          'INSERT INTO samples (name, time, person, phone, status, is_deleted) VALUES (?, ?, ?, ?, "pending", 0)',
          [req.body.name, req.body.time, req.body.person, req.body.phone]
        );
      res.json({ 
        id: result.insertId,
        ...req.body,
        status: 'pending'
      });
    } catch (err) {
      console.error('数据库错误:', err);
      res.status(500).json({ error: '创建样品失败' });
    }
  });

// 单个样品操作
app.route('/api/samples/:id')
  // 获取单个样品
  .get(async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM samples WHERE id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: '样品不存在' });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error('数据库错误:', err);
      res.status(500).json({ error: '获取样品详情失败' });
    }
  })
   // 软删除样品
   .delete(async (req, res) => {
       try {
         // 使用软删除更新标记，而不是物理删除
         let [result] = await pool.execute(
           'UPDATE samples SET is_deleted = 1 WHERE id = ?', 
           [req.params.id]
         );
         
         // 如果样品表中没有找到，尝试更新已审核样品表
         if (result.affectedRows === 0) {
           [result] = await pool.execute(
              'UPDATE reviewed_samples SET is_deleted = 1 WHERE id = ?', 
             [req.params.id]
           );
         }
         
         if (result.affectedRows === 0) {
           return res.status(404).json({ error: '样品不存在' });
         }
         
         res.json({ success: true });
       } catch (err) {
         console.error('数据库错误:', err);
         res.status(500).json({ error: '删除样品失败' });
       }
   });
 
   // 获取所有表中的软删除数据
   app.get('/api/recycle-bin', async (req, res) => {
     try {
       // 查询samples表中软删除的数据
       const [samples] = await pool.execute(
         'SELECT *, "samples" as source_table FROM samples WHERE is_deleted = 1'
       );
       
       // 查询reviewed_samples表中软删除的数据
       const [reviewedSamples] = await pool.execute(
         'SELECT *, "reviewed_samples" as source_table FROM reviewed_samples WHERE is_deleted = 1'
       );
       
       // 合并结果并返回
       const allDeletedData = [...samples, ...reviewedSamples];
       res.json(allDeletedData);
     } catch (err) {
       console.error('数据库错误:', err);
       res.status(500).json({ error: '获取回收箱数据失败' });
     }
   });

// 永久删除样品
    app.delete('/api/samples/:id/permanent', async (req, res) => {
      try {
        // 先查询样品表确认样品是否存在
        const [sampleResult] = await pool.execute(
          'SELECT id FROM samples WHERE id = ?', 
          [req.params.id]
        );
        
        if (sampleResult.length > 0) {
          // 样品存在，先删除已审核样品表中的关联数据
          await pool.execute(
            'DELETE FROM reviewed_samples WHERE sample_id = ?', 
            [req.params.id]
          );
          
          // // 删除审核记录
          // await pool.execute(
          //   'DELETE FROM review WHERE sample_id = ?', 
          //   [req.params.id]
          // );
          
          // 最后删除样品表中的数据
          await pool.execute(
            'DELETE FROM samples WHERE id = ?', 
            [req.params.id]
          );
          
          res.json({ success: true });
        } else {
          // 样品不存在
          return res.status(404).json({ error: '样品不存在' });
        }
      } catch (err) {
        console.error('数据库错误:', err);
        res.status(500).json({ error: '永久删除样品失败' });
      }
    });
  
  // 恢复样品
  app.patch('/api/samples/:id/restore', async (req, res) => {
    try {
      // 先尝试从样品表恢复
      let [result] = await pool.execute(
        'UPDATE samples SET is_deleted = 0 WHERE id = ?', 
        [req.params.id]
      );
      
      // 如果样品表中没有找到，尝试从已审核样品表恢复
      if (result.affectedRows === 0) {
        [result] = await pool.execute(
          'UPDATE reviewed_samples SET is_deleted = 0 WHERE id = ?', 
          [req.params.id]
        );
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '样品不存在' });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('数据库错误:', err);
      res.status(500).json({ error: '恢复样品失败' });
    }
  });

// 更新样品状态
app.patch('/api/samples/:id/status', async (req, res) => {
  try {
    console.log('收到状态更新请求:', req.params.id, req.body);
    
    if (!req.body.status || !['approved', 'rejected'].includes(req.body.status)) {
      console.log('无效的状态值:', req.body.status);
      return res.status(400).json({ error: '无效的状态值' });
    }
    
    const [result] = await pool.execute(
      'UPDATE samples SET status = ? WHERE id = ?',
      [req.body.status, req.params.id]
    );
    
      console.log('数据库更新结果:', result);
      
      // 如果样品表中没有找到，尝试更新已审核样品表
      if (result.affectedRows === 0) {
        const [updatedResult] = await pool.execute(
          'UPDATE reviewed_samples SET status = ? WHERE id = ? AND is_deleted = 0',
          [req.body.status, req.params.id]
        );
      }
      
      if (result.affectedRows === 0) {
        console.log('未找到匹配的样品记录:', req.params.id);
        return res.status(404).json({ error: '样品不存在' });
    }
    
    console.log('状态更新成功:', req.params.id, '新状态:', req.body.status);
    res.json({ success: true });
  } catch (err) {
    console.error('数据库错误:', err);
    res.status(500).json({ error: '更新状态失败', details: err.message });
}
});

// 新增review表相关路由
app.route('/api/review')
  // 创建或更新review记录
  .post(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { sample_id, ...reviewData } = req.body;
      
      // 获取样品信息，包括time字段
      const [sample] = await connection.execute(
        'SELECT id, time FROM samples WHERE id = ? FOR UPDATE',
        [sample_id]
      );
      
      if (sample.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: '关联的样品不存在' });
      }
      
      // 检查是否已存在该样品的review记录
      const [existing] = await connection.execute(
        'SELECT * FROM reviewed_samples WHERE sample_id = ? FOR UPDATE',
        [sample_id]
      );
      
      if (existing.length > 0) {
        // 更新现有记录
        const [result] = await connection.execute(
          `UPDATE reviewed_samples SET 
            test_item = ?, test_result = ?, standard = ?, 
            detection_limit = ?, department = ?,
            responsible_person = ?, notification = ?, updated_at = NOW()
          WHERE sample_id = ?`,
          [
            reviewData.testItem, reviewData.testResult, reviewData.standard,
            reviewData.detectionLimit, reviewData.department,
            reviewData.responsiblePerson, reviewData.notification, sample_id
          ]
        );
        await connection.commit();
        res.json({ success: true, message: 'Review记录已更新' });
      } else {
        // 创建新记录，使用样品的time作为created_at
        const [result] = await connection.execute(
          `INSERT INTO reviewed_samples (
            sample_id, test_item, test_result, standard,
            detection_limit, department,
            responsible_person, notification, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            sample_id, reviewData.testItem, reviewData.testResult, reviewData.standard,
            reviewData.detectionLimit, reviewData.department,
            reviewData.responsiblePerson, reviewData.notification, sample[0].time
          ]
        );
        await connection.commit();
        res.json({ success: true, message: 'Review记录已创建' });
      }
    } catch (err) {
      await connection.rollback();
      console.error('保存Review记录失败:', err);
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        res.status(400).json({ error: '关联的样品不存在' });
      } else {
        res.status(500).json({ error: '保存Review记录失败' });
      }
    } finally {
      connection.release();
    }
  })
  // 获取review记录
  .get(async (req, res) => {
    try {
      const { sample_id } = req.query;
      const [rows] = await pool.execute(
        'SELECT * FROM reviewed_samples WHERE sample_id = ?',
        [sample_id]
      );
      res.json(rows[0] || null);
    } catch (err) {
      console.error('获取Review记录失败:', err);
      res.status(500).json({ error: '获取Review记录失败' });
    }
  });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});