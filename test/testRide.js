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
//create a new user
let token = "";

let location;

describe("GET /getLocation", () => {
  before((done) => {
    request(
      {
        method: "POST",
        uri: "http://localhost:5000/api/users/register",
        json: userDetails,
      },
      function (err, res, body) {
        token = body.token;
        done();
      }
    );
  });

  const url = `http://localhost:5000/api/locations/getLocation`;
  it("Gets all locations for a user", (done) => {
    request(
      {
        method: "GET",
        uri: url,
        headers: {
          "x-auth-token": token,
        },
      },
      function (err, res, body) {
        expect(JSON.parse(body)[0]).to.have.property("_id");
        JSON.parse(body).forEach(function (item, index) {
          if (item.bikes.length > 0) {
            location = item;
          }
        });
        done();
      }
    );
  });
});

describe("PUT /bookRide", () => {
  before((done) => {
    request(
      {
        method: "PUT",
        uri: "http://localhost:5000/api/users/addBalance",
        headers: {
          "x-auth-token": token,
        },
        json: {
          valueToAdd: 10,
        },
      },
      function (err, res, body) {
        done();
      }
    );
  });
  it("Books a ride for the user", (done) => {
    request(
      {
        method: "PUT",
        uri: "http://localhost:5000/api/rides/bookRide",
        headers: {
          "x-auth-token": token,
        },
        json: {
          startLocationName: location.locationName,
          endLocationName: location.locationName,
          bikeId: location.bikes[0]._id,
        },
      },
      function (err, res, body) {
        expect(body.user.activeRide).to.have.property("bikeId");
        done();
      }
    );
  });
});

describe("PUT /endRide", () => {
  it("Ends a ride for the user", (done) => {
    request(
      {
        method: "PUT",
        uri: "http://localhost:5000/api/rides/endRide",
        headers: {
          "x-auth-token": token,
        },
      },
      function (err, res, body) {
        expect(JSON.parse(body)).to.have.property("endRideLocation");
        done();
      }
    );
  });
});

request({
  method: "DELETE",
  uri: "http://localhost:5000/api/users/deleteUser",
  headers: {
    "x-auth-token": token,
  },
  json: {
    username: userDetails.username,
    password: userDetails.password,
  },
});
