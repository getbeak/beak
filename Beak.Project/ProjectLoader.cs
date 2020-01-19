using System;
using System.IO;
using Beak.Project.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Schema;
using Newtonsoft.Json.Serialization;

namespace Beak.Project
{
	public static class ProjectLoader
	{
		private readonly static JsonSerializer _jsonSerializer;
		private readonly static JSchema _projectSchema = JsonSchemaLoader.LoadEmbeddedSchema("project");
		private readonly static JSchema _entrySchema = JsonSchemaLoader.LoadEmbeddedSchema("entry");

		static ProjectLoader()
		{
			_jsonSerializer = new JsonSerializer
			{
				ContractResolver = new DefaultContractResolver
				{
					NamingStrategy = new SnakeCaseNamingStrategy(),
				},
				Formatting = Formatting.Indented,
			};
		}

		public static BeakProject Load(string directory)
		{
			var project = ReadProjectFile(directory);

			project.Tree = DiscoverProjectTree(directory);

			return project;
		}

		public static BeakProject ReadProjectFile(string directory)
		{
			var projectFile = Path.Combine(directory, "project.json");

			return ReadJsonWithSchema<BeakProject>(projectFile, _projectSchema);
		}

		public static ProjectEntry ReadProjectEntry(string filePath)
		{
			return ReadJsonWithSchema<ProjectEntry>(filePath, _entrySchema);
		}

		private static ProjectFolder DiscoverProjectTree(string directory)
		{
			var treePath = Path.Combine(directory, "tree");

			return RecursiveRead(treePath);
		}

		private static ProjectFolder RecursiveRead(string directory)
		{
			var folder = new ProjectFolder();
			var items = Directory.GetFileSystemEntries(directory);

			foreach (var item in items)
			{
				var fileInfo = new FileInfo(item);

				if (fileInfo.Attributes.HasFlag(FileAttributes.Directory))
					folder.Folders.Add(RecursiveRead(fileInfo.FullName));
				else
					folder.Entries.Add(ReadProjectEntry(fileInfo.FullName));
			}

			return folder;
		}

		private static T ReadJsonWithSchema<T>(string filePath, JSchema schema)
		{
			using (var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
			using (var reader = new StreamReader(stream))
			using (var jsonReader = new JsonTextReader(reader))
			{
				var validatingReader = new JSchemaValidatingReader(jsonReader)
				{
					Schema = schema
				};

				return _jsonSerializer.Deserialize<T>(validatingReader);
			}
		}
	}
}
