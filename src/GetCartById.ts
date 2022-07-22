const gql = String;

export const getCartById = gql`
  query GetCartById($id: ID!) {
    cart(id: $id) {
      totalItems
      subTotal {
        amount
        formatted
      }
      items {
        id
        name
        quantity
        unitTotal {
          formatted
        }
      }
    }
  }
`;
