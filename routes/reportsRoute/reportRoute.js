const express = require("express")
const { issueRequest, getIssueRequest, approveRequest, rejectRequest, getUserRequest, getHistory, getMostRequested, sendNotification } = require("../../controllers/reportsController/reportsController")
const { issueRequestValidation, validators } = require("../../utils/validators")

const router = express.Router()

router.post("/reports", issueRequestValidation, validators, issueRequest)
router.get("/reports", getIssueRequest)
router.post("/approve/:id", approveRequest)
router.post("/reject/:id", rejectRequest)
router.get("/reports/:id", getUserRequest)
router.get("/history" , getHistory)
router.get("/notify/:id", sendNotification)
router.get("/mostrequested", getMostRequested )


module.exports = router