const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    let testIssueId; // To store _id for PUT/DELETE tests

    // test for POST with all fields
    test('Create an issue with every field: POST /api/issues/test', function(done) {
        chai.request(server)
            .post('/api/issues/test')
            .send({
                issue_title: 'Test Issue Title',
                issue_text: 'This is a test issue text.',
                created_by: 'Tester',
                assigned_to: 'Assignee',
                status_text: 'In Progress'
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.property(res.body, 'issue_title');
                assert.property(res.body, 'issue_text');
                assert.property(res.body, 'created_by');
                assert.property(res.body, 'assigned_to');
                assert.property(res.body, 'status_text');
                assert.property(res.body, '_id');
                assert.property(res.body, 'created_on');
                assert.property(res.body, 'updated_on');
                assert.isTrue(res.body.open);
                testIssueId = res.body._id; // Store the _id for later tests
                done();
            });
        });

    // Test for POST with required fields only
    test('Create an issue with only required fields: POST /api/issues/test', function(done) {
        chai.request(server)
            .post('/api/issues/test')
            .send({
                issue_title: 'Test Issue Title',
                issue_text: 'This is a test issue text.',
                created_by: 'Tester'
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.property(res.body, 'issue_title');
                assert.property(res.body, 'issue_text');
                assert.property(res.body, 'created_by');
                assert.property(res.body, '_id');
                assert.property(res.body, 'created_on');
                assert.property(res.body, 'updated_on');
                assert.isTrue(res.body.open);
                done();
            });
    });

    // Test for POST with missing required fields only
    test('Create an issue with missing required fields: POST /api/issues/test', function(done) {
        chai.request(server)
            .post('/api/issues/test')
            .send({
                issue_title: 'Test Issue Title'
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'error', 'required field(s) missing');
                done();
            });
    });

    // -- GET Tests --
    test('View issues on a project: GET /api/issues/test', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.isArray(res.body);
                if (res.body.length > 0) {
                    assert.property(res.body[0], '_id');
                    assert.property(res.body[0], 'issue_title');
                    assert.property(res.body[0], 'issue_text');
                    assert.property(res.body[0], 'created_by');
                    assert.property(res.body[0], 'assigned_to');
                    assert.property(res.body[0], 'status_text');
                    assert.property(res.body[0], 'created_on');
                    assert.property(res.body[0], 'updated_on');
                    assert.property(res.body[0], 'open');
                }
                done();
            });
    });

    test('View issues on a project with one filter: GET /api/issues/test', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .query({ open: 'true' }) // Example filter
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.isArray(res.body);
                if (res.body.length > 0) {
                    res.body.forEach(issue => {
                        assert.isTrue(issue.open); // All issues should be open
                    });
                }
                done();
            });
    });

    test('View issues on a project with multiple filters: GET /api/issues/test', function(done) {
        chai.request(server)
            .get('/api/issues/test')
            .query({ open: 'true', created_by: 'Tester' }) // Example filters
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.isArray(res.body);
                if (res.body.length > 0) {
                    res.body.forEach(issue => {
                        assert.isTrue(issue.open); // All issues should be open
                        assert.equal(issue.created_by, 'Tester'); // All issues should be created by Tester
                    });
                }
                done();
            });
    });

    // -- PUT Tests --
    test('Update one field on an issue: PUT /api/issues/test', function(done) {
        chai.request(server)
            .put('/api/issues/test')
            .send({
                _id: testIssueId, // Use the _id from the created issue
                issue_text: 'Updated issue text.'
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'result', 'successfully updated');
                assert.propertyVal(res.body, '_id', testIssueId);
                done();
            });
    });

    test('Update multiple fields on an issue: PUT /api/issues/test', function(done) {
        chai.request(server)
            .put('/api/issues/test')
            .send({
                _id: testIssueId, // Use the _id from the created issue
                issue_title: 'Updated Issue Title',
                status_text: 'Updated Status Text'
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'result', 'successfully updated');
                assert.propertyVal(res.body, '_id', testIssueId);
                done();
            });
    });

    test('Update issue with missing_id: PUT /api/issues/test', function(done) {
        chai.request(server)
            .put('/api/issues/test')
            .send({
                issue_title: 'Updated Issue Title'
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 400);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'error', 'missing _id');
                done();
            });
    });

    test('Update issue with no fields to update: PUT /api/issues/test', function(done) {
        chai.request(server)
            .put('/api/issues/test')
            .send({
                _id: testIssueId // Use the _id from the created issue
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'error', 'no update field(s) sent');
                assert.propertyVal(res.body, '_id', testIssueId);
                done();
            });
    });

    test('Update issue with invalid_id: PUT /api/issues/test', function(done) {
        chai.request(server)
            .put('/api/issues/test')
            .send({
                _id: 'invalid_id', // Use an invalid _id
                issue_text: 'Trying to update with invalid ID.'
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'error', 'could not update');
                assert.propertyVal(res.body, '_id', 'invalid_id');
                done();
            });
    });

    // -- DELETE Tests --
    test('Delete an issue: DELETE /api/issues/test', function(done) {
        chai.request(server)
            .delete('/api/issues/test')
            .send({ 
                _id: testIssueId 
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'result', 'successfully deleted');
                assert.propertyVal(res.body, '_id', testIssueId);
                done();
            });
    });

    test('Delete an issue with invalid _id: DELETE /api/issues/test', function(done) {
        chai.request(server)
            .delete('/api/issues/test')
            .send({ 
                _id: 'invalid123abc' 
            })
            .end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 500);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'error', 'could not delete');
                assert.propertyVal(res.body, '_id', 'invalid123abc');
                done();
            });
    });

    test('Delete an issue with missing _id: DELETE /api/issues/test', function(done) {
        chai.request(server)
            .delete('/api/issues/test')
            .send({ 
                // No _id provided
            }).end(function(err, res) {
                assert.isNull(err);
                assert.equal(res.status, 400);
                assert.equal(res.type, 'application/json');
                assert.propertyVal(res.body, 'error', 'missing _id');
                done();
            });
    });  
});
