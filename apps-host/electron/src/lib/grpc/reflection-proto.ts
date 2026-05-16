/**
 * Inline gRPC reflection protocol — `grpc.reflection.v1alpha`. We parse this
 * with protobufjs at startup rather than vendoring a `.proto` file because
 * electron-esbuild bundles the main process into a single file and shipping
 * the proto as an asset adds packaging complexity for ~50 lines of schema.
 *
 * `v1alpha` is what the vast majority of servers (postman-echo included)
 * expose; `v1` is identical on the wire so the same encoded request works
 * if we ever need to fall back.
 */
export const REFLECTION_PROTO = `
syntax = "proto3";

package grpc.reflection.v1alpha;

message ServerReflectionRequest {
  string host = 1;
  oneof message_request {
    string file_by_filename = 3;
    string file_containing_symbol = 4;
    ExtensionRequest file_containing_extension = 5;
    string all_extension_numbers_of_type = 6;
    string list_services = 7;
  }
}

message ExtensionRequest {
  string containing_type = 1;
  int32 extension_number = 2;
}

message ServerReflectionResponse {
  string valid_host = 1;
  ServerReflectionRequest original_request = 2;
  oneof message_response {
    FileDescriptorResponse file_descriptor_response = 4;
    ExtensionNumberResponse all_extension_numbers_response = 5;
    ListServiceResponse list_services_response = 6;
    ErrorResponse error_response = 7;
  }
}

message FileDescriptorResponse {
  repeated bytes file_descriptor_proto = 1;
}

message ExtensionNumberResponse {
  string base_type_name = 1;
  repeated int32 extension_number = 2;
}

message ListServiceResponse {
  repeated ServiceResponse service = 1;
}

message ServiceResponse {
  string name = 1;
}

message ErrorResponse {
  int32 error_code = 1;
  string error_message = 2;
}
`;
