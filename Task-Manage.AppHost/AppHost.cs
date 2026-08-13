var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres");

var taskDb = postgres.AddDatabase("TaskDb");

var server = builder.AddProject<Projects.Task_Manage_Server>("server")
    .WithReference(taskDb)
    .WaitFor(taskDb)
    .WithHttpHealthCheck("/health")
    .WithExternalHttpEndpoints();

var webfrontend = builder.AddViteApp("webfrontend", "../frontend")
    .WithReference(server)
    .WaitFor(server);

server.PublishWithContainerFiles(webfrontend, "wwwroot");

builder.Build().Run();