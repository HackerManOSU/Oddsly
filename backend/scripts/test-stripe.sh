#!/bin/bash

echo "Testing Stripe Integration..."

# Get auth token
echo "1. Getting auth token..."
AUTH_RESPONSE=$(curl -s -c - -X POST http://localhost:3000/api/signin \
-H "Content-Type: application/json" \
-d '{"email":"zanegarvey503@gmail.com","password":"Keegan5909!"}')

# Extract session cookie from curl cookie jar output
SESSION_COOKIE=$(echo "$AUTH_RESPONSE" | grep "session" | awk '{print $7}')

if [ -z "$SESSION_COOKIE" ]; then
    echo "Failed to get session cookie. Response:"
    echo "$AUTH_RESPONSE"
    exit 1
fi

echo "Session cookie obtained successfully"

# Test customer creation
echo "2. Testing customer creation..."
curl -s -X POST http://localhost:3000/api/stripe/customer \
-H "Content-Type: application/json" \
-H "Cookie: session=${SESSION_COOKIE}" \
| jq '.'

# Test checkout session
echo "3. Testing checkout session..."
curl -s -X POST http://localhost:3000/api/stripe/checkout \
-H "Content-Type: application/json" \
-H "Cookie: session=${SESSION_COOKIE}" \
-d '{"priceId":"price_1Qf9qCBnRek3upMQ6nQofpRA"}' \
| jq '.'

# Test subscription status
echo "4. Testing subscription status..."
curl -s "http://localhost:3000/api/stripe/subscription-status" \
-H "Cookie: session=${SESSION_COOKIE}" \
| jq '.'

echo "Tests completed!"