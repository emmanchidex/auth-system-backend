// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

console.log("AUTH OBJECT:", auth);

router.post('/admin/login', (req, res, next) => {
    console.log("✅ ROUTE HIT: /admin/login");
    next();
}, auth.adminLogin);

router.post('/admin/create-student', (req, res, next) => {
    console.log("🔥 ROUTE HIT: create-student");
    next();
}, auth.createStudent);
router.post('/admin/create-security', (req, res, next) => {
    console.log("🔥 ROUTE HIT: CREATE /admin/security");
    next();
 }, auth.createSecurity);

router.put("/security/:id/toggle-status", auth.toggleSecurityStatus);
router.delete("/security/:id", auth.deleteSecurity);
router.get("/security", auth.getAllSecurity);

router.post('/student/login', auth.studentLogin);
router.post('/security/login', auth.securityLogin);
router.get('/admin/students', (req, res, next) => {
    console.log("🔥 ROUTE HIT: GET /admin/students");
    next();
}, auth.getStudents);

router.delete('/admin/students/:id', (req, res, next) => {
    console.log("🔥 ROUTE HIT: DELETE /admin/students");
    next();
}, 
     auth.deleteStudent);

module.exports = router;