Here's the denormalized database schema for the provided data in README.md format:

## Database Schema

**Note:** This schema is denormalized for better performance.

### Products Table
```md
| Column Name | Data Type | Constraints | Description               |
|-------------|-----------|-------------|---------------------------|
| id          | String    | PRIMARY KEY | Unique product ID         |
| name        | String    | NOT NULL    | Product's name            |
| price       | Float     | NOT NULL    | Product's price per unit |
```

### Orders Table (Denormalized)
```md
| Column Name  | Data Type | Constraints                    | Description                          |
|--------------|-----------|--------------------------------|--------------------------------------|
| lineId       | UUID      | PRIMARY KEY                    | Line item ID                         |
| id           | String    |                                | Order ID                             |
| date         | Date      | NOT NULL                       | Order date                           |
| email        | String    |                                | Customer's email                     |
| fullName     | String    | NOT NULL                       | Customer's full name                 |
| productId    | String    | FOREIGN KEY (Products.id)      | References associated product        |
| totalAmount  | Float     | NOT NULL                       | Total amount for the order           |
| quantity     | Integer   | NOT NULL, CHECK (quantity > 0) | Quantity of product ordered          |
```

### Denormalization notes
In this version of the schema, the `fullName` and `email` fields are included directly in the denormalized Orders table. 

The totalAmount value is stored directly, without item's amount.

```md
| Column Name | Data Type | Constraints | Description           |
|-------------|-----------|-------------|-----------------------|
| id          | UUID      | PRIMARY KEY | Unique customer ID    |
| email       | String    | UNIQUE      | Customer's email      |
| fullName    | String    | NOT NULL    | Customer's full name  |
```
