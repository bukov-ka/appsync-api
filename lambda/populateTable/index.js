"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
const dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient();
const handler = async () => {
    try {
        const customerTableName = process.env.CUSTOMER_TABLE;
        const orderTableName = process.env.ORDER_TABLE;
        const productTableName = process.env.PRODUCT_TABLE;
        if (!customerTableName || !orderTableName || !productTableName) {
            throw new Error('Missing environment variables pointing to tables.');
        }
        // Define your initial test data here
        const customers = [
            {
                email: 'johndoe@example.com',
                fullName: 'John Doe',
            },
            {
                email: 'janedoe@example.com',
                fullName: 'Jane Doe',
            },
        ];
        const orders = [
            {
                id: 'order1',
                date: '2022-01-01',
                totalAmount: 100,
                email: 'johndoe@example.com', // use this field to associate customer with the order
                product: 'Product A', // use this field to associate product with the order
            
            },
            {
                id: 'order2',
                date: '2022-01-02',
                totalAmount: 200,
                email: 'janedoe@example.com', // use this field to associate customer with the order
                product: 'Product A', // use this field to associate product with the order
            },
        ];
        const products = [
            {
                name: 'Product A',
                price: 50,
                quantity: 10,
            },
            {
                name: 'Product B',
                price: 25,
                quantity: 20,
            },
        ];
        console.log(JSON.stringify(process.env));
        await Promise.all(customers.map((item) => dynamoDb.put({ TableName: customerTableName, Item: item }).promise()));
        await Promise.all(orders.map((item) => dynamoDb.put({ TableName: orderTableName, Item: item }).promise()));
        await Promise.all(products.map((item) => dynamoDb.put({ TableName: productTableName, Item: item }).promise()));
        console.log('Test data populated successfully.');
        return {
            statusCode: 200,
            message: 'Tables populated with test data.',
        };
    }
    catch (error) {
        console.error('Error populating test data:', error);
        throw error;
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBbUM7QUFFbkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxrQkFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBRXhDLE1BQU0sT0FBTyxHQUFHLEtBQUssSUFBSSxFQUFFO0lBQ2hDLElBQUk7UUFDRixNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO1FBQ3JELE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO1FBQy9DLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7UUFDbkQsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsY0FBYyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDOUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1NBQ3RFO1FBRUQscUNBQXFDO1FBQ3JDLE1BQU0sU0FBUyxHQUFHO1lBQ2hCO2dCQUNFLEtBQUssRUFBRSxxQkFBcUI7Z0JBQzVCLFFBQVEsRUFBRSxVQUFVO2FBQ3JCO1lBQ0Q7Z0JBQ0UsS0FBSyxFQUFFLHFCQUFxQjtnQkFDNUIsUUFBUSxFQUFFLFVBQVU7YUFDckI7U0FDRixDQUFDO1FBRUYsTUFBTSxNQUFNLEdBQUc7WUFDYjtnQkFDRSxFQUFFLEVBQUUsUUFBUTtnQkFDWixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsV0FBVyxFQUFFLEdBQUc7Z0JBQ2hCLGFBQWEsRUFBRSxxQkFBcUIsRUFBRSxzREFBc0Q7YUFDN0Y7WUFDRDtnQkFDRSxFQUFFLEVBQUUsUUFBUTtnQkFDWixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsV0FBVyxFQUFFLEdBQUc7Z0JBQ2hCLGFBQWEsRUFBRSxxQkFBcUIsRUFBRSxzREFBc0Q7YUFDN0Y7U0FDRixDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUc7WUFDZjtnQkFDRSxJQUFJLEVBQUUsV0FBVztnQkFDakIsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLEVBQUU7YUFDYjtZQUNEO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixLQUFLLEVBQUUsRUFBRTtnQkFDVCxRQUFRLEVBQUUsRUFBRTthQUNiO1NBQ0YsQ0FBQztRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV6QyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQ2YsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQ3JCLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQ3JFLENBQ0YsQ0FBQztRQUVGLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDZixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDbEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQ2xFLENBQ0YsQ0FBQztRQUVGLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDZixRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDcEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FDcEUsQ0FDRixDQUFDO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1FBRWpELE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRSxrQ0FBa0M7U0FDNUMsQ0FBQztLQUNIO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BELE1BQU0sS0FBSyxDQUFDO0tBQ2I7QUFDSCxDQUFDLENBQUM7QUEvRVcsUUFBQSxPQUFPLFdBK0VsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCIH0gZnJvbSAnYXdzLXNkayc7XHJcblxyXG5jb25zdCBkeW5hbW9EYiA9IG5ldyBEeW5hbW9EQi5Eb2N1bWVudENsaWVudCgpO1xyXG5cclxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGN1c3RvbWVyVGFibGVOYW1lID0gcHJvY2Vzcy5lbnYuQ1VTVE9NRVJfVEFCTEU7XHJcbiAgICBjb25zdCBvcmRlclRhYmxlTmFtZSA9IHByb2Nlc3MuZW52Lk9SREVSX1RBQkxFO1xyXG4gICAgY29uc3QgcHJvZHVjdFRhYmxlTmFtZSA9IHByb2Nlc3MuZW52LlBST0RVQ1RfVEFCTEU7XHJcbiAgICBpZiAoIWN1c3RvbWVyVGFibGVOYW1lIHx8ICFvcmRlclRhYmxlTmFtZSB8fCAhcHJvZHVjdFRhYmxlTmFtZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgZW52aXJvbm1lbnQgdmFyaWFibGVzIHBvaW50aW5nIHRvIHRhYmxlcy4nKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZWZpbmUgeW91ciBpbml0aWFsIHRlc3QgZGF0YSBoZXJlXHJcbiAgICBjb25zdCBjdXN0b21lcnMgPSBbXHJcbiAgICAgIHtcclxuICAgICAgICBlbWFpbDogJ2pvaG5kb2VAZXhhbXBsZS5jb20nLFxyXG4gICAgICAgIGZ1bGxOYW1lOiAnSm9obiBEb2UnLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgZW1haWw6ICdqYW5lZG9lQGV4YW1wbGUuY29tJyxcclxuICAgICAgICBmdWxsTmFtZTogJ0phbmUgRG9lJyxcclxuICAgICAgfSxcclxuICAgIF07XHJcblxyXG4gICAgY29uc3Qgb3JkZXJzID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICdvcmRlcjEnLFxyXG4gICAgICAgIGRhdGU6ICcyMDIyLTAxLTAxJyxcclxuICAgICAgICB0b3RhbEFtb3VudDogMTAwLFxyXG4gICAgICAgIGN1c3RvbWVyRW1haWw6ICdqb2huZG9lQGV4YW1wbGUuY29tJywgLy8gdXNlIHRoaXMgZmllbGQgdG8gYXNzb2NpYXRlIGN1c3RvbWVyIHdpdGggdGhlIG9yZGVyXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ29yZGVyMicsXHJcbiAgICAgICAgZGF0ZTogJzIwMjItMDEtMDInLFxyXG4gICAgICAgIHRvdGFsQW1vdW50OiAyMDAsXHJcbiAgICAgICAgY3VzdG9tZXJFbWFpbDogJ2phbmVkb2VAZXhhbXBsZS5jb20nLCAvLyB1c2UgdGhpcyBmaWVsZCB0byBhc3NvY2lhdGUgY3VzdG9tZXIgd2l0aCB0aGUgb3JkZXJcclxuICAgICAgfSxcclxuICAgIF07XHJcblxyXG4gICAgY29uc3QgcHJvZHVjdHMgPSBbXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiAnUHJvZHVjdCBBJyxcclxuICAgICAgICBwcmljZTogNTAsXHJcbiAgICAgICAgcXVhbnRpdHk6IDEwLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogJ1Byb2R1Y3QgQicsXHJcbiAgICAgICAgcHJpY2U6IDI1LFxyXG4gICAgICAgIHF1YW50aXR5OiAyMCxcclxuICAgICAgfSxcclxuICAgIF07XHJcblxyXG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYpKTtcclxuXHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgICAgY3VzdG9tZXJzLm1hcCgoaXRlbSkgPT5cclxuICAgICAgICBkeW5hbW9EYi5wdXQoeyBUYWJsZU5hbWU6IGN1c3RvbWVyVGFibGVOYW1lLCBJdGVtOiBpdGVtIH0pLnByb21pc2UoKVxyXG4gICAgICApXHJcbiAgICApO1xyXG5cclxuICAgIGF3YWl0IFByb21pc2UuYWxsKFxyXG4gICAgICBvcmRlcnMubWFwKChpdGVtKSA9PlxyXG4gICAgICAgIGR5bmFtb0RiLnB1dCh7IFRhYmxlTmFtZTogb3JkZXJUYWJsZU5hbWUsIEl0ZW06IGl0ZW0gfSkucHJvbWlzZSgpXHJcbiAgICAgIClcclxuICAgICk7XHJcblxyXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoXHJcbiAgICAgIHByb2R1Y3RzLm1hcCgoaXRlbSkgPT5cclxuICAgICAgICBkeW5hbW9EYi5wdXQoeyBUYWJsZU5hbWU6IHByb2R1Y3RUYWJsZU5hbWUsIEl0ZW06IGl0ZW0gfSkucHJvbWlzZSgpXHJcbiAgICAgIClcclxuICAgICk7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ1Rlc3QgZGF0YSBwb3B1bGF0ZWQgc3VjY2Vzc2Z1bGx5LicpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgbWVzc2FnZTogJ1RhYmxlcyBwb3B1bGF0ZWQgd2l0aCB0ZXN0IGRhdGEuJyxcclxuICAgIH07XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBvcHVsYXRpbmcgdGVzdCBkYXRhOicsIGVycm9yKTtcclxuICAgIHRocm93IGVycm9yO1xyXG4gIH1cclxufTtcclxuIl19