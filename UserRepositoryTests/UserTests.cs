/*using Microsoft.VisualStudio.TestTools.UnitTesting;*/
/*using PulseMurder;*/
/*using System;*/
/*using System.Collections.Generic;*/
/*using System.Linq;*/
/*using System.Text;*/
/*using System.Threading.Tasks;*/

namespace PulseMurder.Tests {
    [TestClass()]
    public class UserTests {
        [TestMethod()]
        public void ToStringTest() {
            string? expected = "Id: 0,Name:Miki,Avatar:null,Murder:false";
            User test = new() {Name = "Miki",Murder = false};
            Assert.IsNotNull(test);

            Assert.AreEqual(expected,test.ToString());
        }
        [TestMethod]
        public void UserNameTest(){
            string? expectedName = "Paprika";
            User test = new() {Name = "Paprika", Murder=false};
            Assert.IsNotNull(test);

            Assert.AreEqual(expectedName,test.Name);
            Assert.ThrowsException<ArgumentNullException>(() => test.Name == null);
            Assert.ThrowsException<ArgumentException>(() => test.Name == " ");
        }

        [TestMethod]
        public void UserMurderTest(){
            User test = new () {Name = "Peter", Murder = true};
            Assert.IsNotNull(test);
            Assert.AreEqual(true,test.Murder);
        }
    }
}
