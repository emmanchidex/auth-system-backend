const express = require('express');
const router = express.Router();

const branch = require('../controllers/branchController');
const incident = require('../controllers/incidentTypeController');
const severity = require('../controllers/severityController');

// ========================
// GLOBAL ROUTE LOGGER
// ========================

console.log("🔥 ADMIN ROUTES LOADED");
console.log("AUTH OBJECT:", branch );
console.log("AUTH OBJECT:", incident  );
console.log("AUTH OBJECT:", severity );


router.use((req, res, next) => {
    console.log("\n==============================");
    console.log("🔵 ROUTE HIT");
    console.log("Method:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log("==============================\n");
    next();
});

// ========================
// BRANCHES
// ========================
router.post('/branches', (req, res, next) => {
    console.log("➡️ Branch CREATE route hit");
    next();
}, branch.createBranch);

router.get('/branches', (req, res, next) => {
    console.log("➡️ Branch GET ALL route hit");
    next();
}, branch.getBranches);

router.put('/branches/:id', (req, res, next) => {
    console.log("➡️ Branch UPDATE route hit");
    next();
}, branch.updateBranch);

router.delete('/branches/:id', (req, res, next) => {
    console.log("➡️ Branch DELETE route hit");
    next();
}, branch.deleteBranch);

// ========================
// INCIDENT TYPES
// ========================
router.post('/incident-types', (req, res, next) => {
    console.log("➡️ Incident CREATE route hit");
    next();
}, incident.createIncidentType);

router.get('/incident-types', (req, res, next) => {
    console.log("➡️ Incident GET ALL route hit");
    next();
}, incident.getIncidentTypes);

router.put('/incident-types/:id', (req, res, next) => {
    console.log("➡️ Incident UPDATE route hit");
    next();
}, incident.updateIncidentType);

router.delete('/incident-types/:id', (req, res, next) => {
    console.log("➡️ Incident DELETE route hit");
    next();
}, incident.deleteIncidentType);

// ========================
// SEVERITY
// ========================
router.post('/severity', (req, res, next) => {
    console.log("➡️ Severity CREATE route hit");
    next();
}, severity.createSeverity);

router.get('/severity', (req, res, next) => {
    console.log("➡️ Severity GET ALL route hit");
    next();
}, severity.getSeverities);

router.put('/severity/:id', (req, res, next) => {
    console.log("➡️ Severity UPDATE route hit");
    next();
}, severity.updateSeverity);

router.delete('/severity/:id', (req, res, next) => {
    console.log("➡️ Severity DELETE route hit");
    next();
}, severity.deleteSeverity);

module.exports = router;