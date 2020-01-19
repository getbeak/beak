using Newtonsoft.Json;

namespace Beak.Project.Models
{
	public class BeakProject
	{
		public string Version { get; set; }

		public string Name { get; set; }

		[JsonIgnore]
		public ProjectFolder Tree { get; set; }
	}
}
