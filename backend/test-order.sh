#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWx3MGpnaGgwMDAwNnNzbTduZzA1N2kzIiwiZW1haWwiOiJ0ZXN0b3JkZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE3NzE2NTk4NjUsImV4cCI6MTc3MjI2NDY2NX0.WgAAR7pMHuS03ENKWUq3wjPr7IqGbIDLTJRRYa1VZ84"

# Let's hit the endpoint to get products so we have a valid product ID
PRODUCTS=$(curl -s "http://localhost:8080/api/v1/products")
FIRST_PRODUCT_ID=$(echo $PRODUCTS | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)

echo "Testing Order with Product ID: $FIRST_PRODUCT_ID"

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cart": [
      {
        "productId": "'$FIRST_PRODUCT_ID'",
        "quantity": 1
      }
    ],
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "nathigechmaranata@gmail.com",
      "phone": "0911223344",
      "address": "Bole",
      "city": "Addis Ababa"
    }
  }' \
  http://localhost:8080/api/v1/orders -v
