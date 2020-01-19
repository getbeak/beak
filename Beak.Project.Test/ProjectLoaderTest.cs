using System.IO;
using Xunit;

namespace Beak.Project.Test
{
	public class ProjectLoaderTest
	{
		private const string BeakPath = "C:\\Users\\alexr\\Source\\0xdeafcafe\\Beak";
		private const string ExampleProjPath = "Testing\\ExampleProject";

		[Fact]
		public void Test1()
		{ 
			var projectPath = Path.Combine(BeakPath, ExampleProjPath);
			var project = ProjectLoader.Load(projectPath);
		}
	}
}
