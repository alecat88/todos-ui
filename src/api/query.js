import gql from "graphql-tag";

export const GET_TODOS = gql`
  query {
    todoQuery {
      todos {
        id
        title
        completed
      }
    }
  }
`;
