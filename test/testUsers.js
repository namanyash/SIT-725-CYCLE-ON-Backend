const expect = require("chai").expect;
const request = require("request");
const idGenerator = require("../helper/idGenerator");

const userDetails = {
  firstName: "TestName",
  lastName: "TestLastName",
  email: idGenerator.makeid(5) + "@yopmail.com",
  password: "passwordsSomething",
  username: idGenerator.makeid(10),
  phoneNumber: idGenerator.makeid_num(10),
};
let token = "";

describe("POST /register", () => {
  const url = `http://localhost:5000/api/users/register`;
  it("Registers a user", (done) => {
    request(
      {
        method: "POST",
        uri: url,
        json: userDetails,
      },
      function (err, res, body) {
        expect(body).to.have.property("token");
        done();
      }
    );
  });
  it("Fails for invalid input", (done) => {
    request(
      {
        method: "POST",
        uri: url,
        json: userDetails,
      },
      function (err, res, body) {
        expect(body).to.have.property("errors");
        done();
      }
    );
  });
});

describe("POST /login", () => {
  const url = `http://localhost:5000/api/users/loginUP`;
  it("Logs in a user", (done) => {
    request(
      {
        method: "POST",
        uri: url,
        json: {
          username: userDetails.username,
          password: userDetails.password,
        },
      },
      function (err, res, body) {
        expect(body).to.have.property("token");
        token = body.token;
        done();
      }
    );
  });
  it("Fails for invalid credentials", (done) => {
    request(
      {
        method: "POST",
        uri: url,
        json: {
          username: userDetails.username,
          password: userDetails.password + "invalid",
        },
      },
      function (err, res, body) {
        expect(body).to.have.property("errors");
        done();
      }
    );
  });
});

describe("GET /getUser", () => {
  const url = `http://localhost:5000/api/users/getUser`;
  it("Gets user details", (done) => {
    request(
      {
        method: "GET",
        uri: url,
        headers: {
          "x-auth-token": token,
        },
      },
      function (err, res, body) {
        expect(JSON.parse(body)).to.have.property("_id");
        done();
      }
    );
  });
});



describe("PUT /addBalance", () => {
  const url = `http://localhost:5000/api/users/addBalance`;
  it("Adds Balance to a user", (done) => {
    request(
      {
        method: "PUT",
        uri: url,
        headers: {
          "x-auth-token": token,
        },
        json: {
          valueToAdd: 10,
        },
      },
      function (err, res, body) {
        expect(body.balance).to.be.equal(10);
        done();
      }
    );
  });
});

describe("PUT /withdrawBalance", () => {
  const url = `http://localhost:5000/api/users/withdrawBalance`;
  it("Withdraws Balance from a user", (done) => {
    request(
      {
        method: "PUT",
        uri: url,
        headers: {
          "x-auth-token": token,
        },
        json: {
          valueToSubtract: 10,
        },
      },
      function (err, res, body) {
        expect(body.balance).to.be.equal(0);
        done();
      }
    );
  });
});

describe("DELETE /deleteUser", () => {
  const url = `http://localhost:5000/api/users/deleteUser`;
  it("Deletes a user", (done) => {
    request(
      {
        method: "DELETE",
        uri: url,
        headers: {
          "x-auth-token": token,
        },
        json: {
          username: userDetails.username,
          password: userDetails.password,
        },
      },
      function (err, res, body) {
        expect(body).to.have.property("msg");
        done();
      }
    );
  });
});