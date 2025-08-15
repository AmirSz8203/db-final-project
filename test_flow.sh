#!/bin/bash

# Exit on error
set -e

# 1. Sign up a new user
TIMESTAMP=$(date +%s)
USERNAME="testuser_$TIMESTAMP"
EMAIL="testuser_$TIMESTAMP@example.com"

echo "--- Signing up user '$USERNAME' ---"
SIGNUP_RESPONSE=$(curl -s -X POST "http://localhost:8000/signup" \
    -H "Content-Type: application/json" \
    -d '{"username": "'"$USERNAME"'", "email": "'"$EMAIL"'", "password": "password123"}')

echo "Signup Response: $SIGNUP_RESPONSE"
if [[ ! $(echo "$SIGNUP_RESPONSE" | grep "$USERNAME") ]]; then
    echo "Signup failed!"
    exit 1
fi

# 2. Log in to get a token
echo "--- Logging in user '$USERNAME' ---"
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$USERNAME&password=password123")

echo "Login Response: $LOGIN_RESPONSE"
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "Login failed! Could not extract access token."
    exit 1
fi
echo "Access Token: $ACCESS_TOKEN"

# 3. Access protected /users/me endpoint
echo "--- Accessing /users/me ---"
ME_RESPONSE=$(curl -s -X GET "http://localhost:8000/users/me/" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

echo "/users/me Response: $ME_RESPONSE"
if [[ ! $(echo "$ME_RESPONSE" | grep "$USERNAME") ]]; then
    echo "Failed to access /users/me!"
    exit 1
fi

# 4. Access protected /orders endpoint
echo "--- Accessing /orders ---"
ORDERS_RESPONSE=$(curl -s -X GET "http://localhost:8000/orders" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

echo "/orders Response: $ORDERS_RESPONSE"
# This will return an empty list, which is correct for a new user
if [[ ! $(echo "$ORDERS_RESPONSE" | grep "\[\]") ]]; then
    echo "Failed to access /orders or response was not an empty list!"
    exit 1
fi

echo "--- All tests passed! ---"
