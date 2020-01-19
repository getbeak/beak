using System.IO;
using System.Reflection;
using Newtonsoft.Json.Schema;

namespace Beak.Project
{
	internal static class JsonSchemaLoader
	{
		static readonly Assembly _ass = typeof(JsonSchemaLoader).GetTypeInfo().Assembly;

		internal static JSchema LoadEmbeddedSchema(string name)
		{
			var stream = _ass.GetManifestResourceStream($"Beak.Project.Schemas.{name}.jsonschema");
			var str = string.Empty;

			using (var reader = new StreamReader(stream))
				str = reader.ReadToEnd();

			return JSchema.Parse(str);
		}
	}
}
