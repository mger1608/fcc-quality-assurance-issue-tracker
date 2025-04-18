'use strict';

const mongoose = require('mongoose');
const ObjectID = mongoose.Types.ObjectId; // Import ObjectId type for MongoDB
const Issue = require('../models/issue.js'); // Assuming you have an Issue model defined in models/issue.js

module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(async function (req, res){ // Make the function async
      let project = req.params.project;
      // Combine project filter with any query filters
      let filter = { project: project, ...req.query };

      // Convert 'open' query string ('true'/'false') to boolean if present
      if (filter.hasOwnProperty('open')) {
        filter.open = filter.open === 'true';
      }

      try {
        // Fetch issues from the database using the filter
        const issues = await Issue.find(filter);
        // Send array of matching issue objects back as JSON
        res.json(issues);
      } catch (err) {
        // Handle potential database errors
        console.error("Database query error:", err);
        res.status(500).json({ error: 'Could not retrieve issues', details: err.message });
      }
    })

    .post(async function (req, res){ // Consider making this async too
      let project = req.params.project;
      // Access body directly
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      // Check if required fields are present
      if (!issue_title || !issue_text || !created_by) {
        // No need to return status(400) here, just send the JSON
        return res.json({ error: 'required field(s) missing' });
      }

      // Create a new instance of issue object using validated data
      const newIssueData = {
        project: project, // Add project field
        issue_title: issue_title,
        issue_text: issue_text,
        created_by: created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        // _id is generated automatically by MongoDB/Mongoose
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };

      try {
        // Save new issue object to MongoDB
        let issue = new Issue(newIssueData);
        const savedIssue = await issue.save();
        // If save is successful, send the saved issue object back as JSON
        res.json(savedIssue);
      } catch (err) {
        // If there is an error saving to the database, send an error response
        console.error("Database save error:", err);
        // Avoid sending detailed error messages in production if possible
        res.status(500).json({ error: 'Could not save issue' });
      }

    })
    
    .put(async function (req, res){
      let project = req.params.project;
      const _id = req.body._id; 
      
      // Check if _id is present in req.body else send specific error response
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      if (!ObjectID.isValid(_id)) {
        return res.json({ error: 'could not update', '_id': _id });
      }

      // Build update object explicitly
      let updateData = {};
      const allowedFields = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];

      let hasUpdateFields = false;
      for (const field of allowedFields) {
        // Check if the field exists in the request body
        if (req.body.hasOwnProperty(field)) {
          // Special handling for 'open' if sent as string
          if (field === 'open' && typeof req.body.open === 'string') {
            updateData.open = req.body.open === 'true';
          } else {
            // Only add the field if it's not undefined (or handle null)
            if (req.body[field] !== undefined) {
              updateData[field] = req.body[field];
            }
          }
          hasUpdateFields = true; 
        }
      }

      // Check if any update fields were sent
      if (!hasUpdateFields) {
        // User the correct _id variable here
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }

      // Add the updated timestamp
      updateData.updated_on = new Date();

      // Perform the update
      // Find the issue in the database using  _id and project, update specified fields and updated_on timestamp
      try {
         const updatedIssue = await Issue.findByIdAndUpdate(
        _id,
        updateData,
        { new: false }
        );
        
        // Check if document found and updated
        if (!updatedIssue) {
          // If findByIdAndUpdate returns null, the ID wasn't found
          return res.json({ error: 'could not update', '_id': _id });
        }

        // Send correct success response
        res.json({ result: 'successfully updated', '_id': _id });

      } catch (err) {
        // Handle database errors
        console.error("Database update error:", err);
        // Send the generic 'could not update' error 
        return res.json({ error: 'could not update', '_id': _id });
        }
    })
    
    .delete(async function (req, res){
      let project = req.params.project;

      // Check if _id is present in req.body else send specific error response
      if (!req.body._id) {
        return res.json({ error: 'missing _id' });
      }

      // Attempt to delete issue from database using provided _id and project
      const _id = req.body._id; // Store _id in a variable for later use
      
      if (!ObjectID.isValid(_id)) {
        return res.json({ error: 'could not delete', '_id': _id });
      }
      
      try {
        const result = await Issue.findByIdAndDelete(_id);
        // If result is null, it means no document was found with that _id
        if (!result) {
          return res.json({ error: 'could not delete', '_id': _id });
        }
        // If deletion was successful, send a success response
        res.json({ result: 'successfully deleted', '_id': _id });

      // If _id not found or other error, send specific error response
      
      } catch (err) {
        console.error("Database delete error:", err);
        return res.json({ error: 'could not delete', '_id': _id });
      }
    });
};

