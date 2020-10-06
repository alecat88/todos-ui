import gql from "graphql-tag";

export const CREATE_TODO = gql`
  mutation($text: String!) {
    todoMutation {
      createTodo(text: $text) {
        id
        title
        completed
      }
    }
  }
`;
export const UPDATE_TODO = gql`
  mutation($id: String!, $text: String!, $completed: Boolean) {
    todoMutation {
      updateTodo(id: $id, text: $text, completed: $completed) {
        id
        title
        completed
      }
    }
  }
`;
